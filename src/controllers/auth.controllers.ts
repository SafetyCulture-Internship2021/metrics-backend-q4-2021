import type {Request, ResponseToolkit, Server, ServerAuthScheme} from "@hapi/hapi";
import Boom from "@hapi/boom";
import type {Res} from "./common";

import Joi from "joi";

import {Database} from "../db";
import {AuthService} from "../services";
import {decodeAccessToken, decodeRefreshToken, encodeAccessToken, encodeRefreshToken, generateClaims} from "../utils";
import { getLogger } from "./common";
import {Account, AccountToken} from "../models";
import {Controller} from "./controller";

const SCHEME_NAME = 'jwt';

const loginSchema = Joi.object().keys({
  email: Joi.string().email().min(3).max(256).required(),
  password: Joi.string().min(8).max(128).required(),
});
const registerSchema = Joi.object().keys({
  name: Joi.string().min(1).max(64).required(),
  email: Joi.string().email().min(3).max(256).required(),
  password: Joi.string().min(8).max(128).required(),
});
const refreshSchema = Joi.object().keys({
  token: Joi.string().required(),
});

/**
 * Parameter body for `login`
 */
type LoginRequest = {
  /**
   * Email address to sign in with
   */
  email: string;
  /**
   * Password to sign in with
   */
  password: string
};

/**
 * Result from `login`
 */
type LoginResponse = {
  /**
   * Refresh token to generate further access tokens
   */
  refresh_token: string;
  /**
   * Access token to authenticate requests with
   */
  access_token: string;
};

/**
 * Parameter body for `register`
 */
type RegisterRequest = {
  /**
   * Email address to register with
   */
  email: string;
  /**
   * Password to register with
   */
  password: string;
  /**
   * Display name to register with
   */
  name: string
}

/**
 * Result from `register`
 */
type RegisterResponse = {
  /**
   * Refresh token to generate further access tokens
   */
  refresh_token: string;
  /**
   * Access token to authenticate requests with
   */
  access_token: string;
};

/**
 * Parameter body for `refresh`
 */
type RefreshRequest = {
  /**
   * Refresh token to generate a new access token for
   */
  token: string;
}

/**
 * Result from `refresh`
 */
type RefreshResponse = {
  /**
   * Access token to authenticate requests with
   */
  access_token: string;
}

/**
 * Authentication controller implementing routes
 */
export class AuthController extends Controller {
  public constructor(private readonly db: Database, private readonly authService: AuthService) {
    super();
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  /**
   * register the routes from this controller with hapi
   * @param svc {Server} hapi service reference
   */
  public registerController(svc: Server) {
    svc.auth.scheme(SCHEME_NAME, () => {
      return {
        authenticate: async (req: Request, h: ResponseToolkit): Promise<Res<unknown>> => {
          const {authorization} = req.headers;
          if (!authorization) {
            return Boom.unauthorized(null, SCHEME_NAME);
          }
          const claims = await decodeAccessToken(authorization);

          return h.authenticated({ credentials: claims });
        }
      }
    });
    svc.auth.strategy(SCHEME_NAME, SCHEME_NAME);
    svc.auth.default(SCHEME_NAME);

    svc.route({
      method: "POST",
      path: "/login",
      handler: this.login,
      options: {
        auth: false,
        validate: {
          payload: loginSchema
        }
      }
    });

    svc.route({
      method: "POST",
      path: "/register",
      handler: this.register,
      options: {
        auth: false,
        validate: {
          payload: registerSchema
        }
      }
    });

    svc.route({
      method: "POST",
      path: "/refresh",
      handler: this.refresh,
      options: {
        auth: false,
        validate: {
          payload: refreshSchema
        }
      }
    })
  }

  /**
   * @private
   * Login authenticates the provided credentials
   * @param req {Request} hapi request object
   * @param h {ResponseToolkit} hapi response toolkit
   * @return {Res<LoginResponse>} response payload
   */
  private async login(req: Request, h: ResponseToolkit): Promise<Res<LoginResponse>> {
    const logger = getLogger(req);
    const {email, password} = req.payload as LoginRequest;

    const tx = await this.db.tx()

    let account: Account | undefined;
    try {
      account = await this.authService.fetchAccountByLogin({
        email,
        password
      }, {
        tx
      });
    } catch (err) {
      await tx.rollback();
      logger.error(`Failed to fetch account: ${err}`, err)
      return Boom.internal();
    }

    if (!account) {
      await tx.rollback()
      return Boom.unauthorized();
    }

    let token: AccountToken;
    try {
      token = await this.authService.createAccountToken(account.id, {
        tx
      });
    } catch (err) {
      await tx.rollback();
      logger.error(`Failed to create account token: ${err}`, err)
      return Boom.internal();
    }

    await tx.commit();

    return {
      refresh_token: await encodeRefreshToken(token),
      access_token: await encodeAccessToken(generateClaims(account, token))
    };
  }

  /**
   * @private
   * Register creates a new account with the provided parameters
   * @param req {Request} hapi request object
   * @param h {ResponseToolkit} hapi response toolkit
   * @return {Res<LoginResponse>} response payload
   */
  private async register(req: Request, h: ResponseToolkit): Promise<Res<RegisterResponse>> {
    const logger = getLogger(req);
    const { email, password, name } = req.payload as RegisterRequest;

    const tx = await this.db.tx();

    let account: Account | undefined;
    try {
      account = await this.authService.createAccount({
        email,
        password,
        name
      }, {
        tx
      });
    } catch (err) {
      await tx.rollback();
      logger.error(`Failed to create account: ${err}`, err)
      return Boom.internal();
    }
    if (!account) {
      // If createAccount returns undefined it'll mean we've found a duplicate account
      // Return unauthorized
      return Boom.unauthorized();
    }

    let token: AccountToken;
    try {
      token = await this.authService.createAccountToken(account.id, {
        tx
      });
    } catch (err) {
      await tx.rollback();
      logger.error(`Failed to create token: ${err}`, err);
      return Boom.internal();
    }

    await tx.commit();

    return {
      refresh_token: await encodeRefreshToken(token),
      access_token: await encodeAccessToken(generateClaims(account, token))
    };
  }

  /**
   * @private
   * Refresh generates a new access token using the provided refresh token
   * @param req {Request} hapi request object
   * @param h {ResponseToolkit} hapi response toolkit
   * @return {Res<RefreshResponse>} response payload
   */
  private async refresh(req: Request, h: ResponseToolkit): Promise<Res<RefreshResponse>> {
    const logger = getLogger(req);
    const { token } = req.payload as RefreshRequest;

    const decoded = await decodeRefreshToken(token);

    const tx = await this.db.tx();
    let accountToken: AccountToken | undefined;
    try {
      accountToken = await this.authService.fetchAccountToken(decoded.id, { tx });
    } catch (err) {
      await tx.rollback();
      logger.error(`Failed to fetch token: ${err}`, err);
      return Boom.internal();
    }

    if (!accountToken) {
      // if fetchAccountToken has returned undefined, the token isn't valid
      return Boom.unauthorized();
    }

    let account: Account | undefined;
    try {
      account = await this.authService.fetchAccount(accountToken.account_id, {tx});
    } catch (err) {
      await tx.rollback();
      logger.error(`Failed to fetch account: ${err}`, err);
      return Boom.internal();
    }

    if (!account) {
      return Boom.unauthorized();
    }

    await tx.rollback();

    return {
      access_token: await encodeAccessToken(generateClaims(account, accountToken)),
    }
  }
}
