import type {Request, ResponseToolkit, Server, ServerAuthScheme} from "@hapi/hapi";
import Boom from "@hapi/boom";
import type {Res} from "../routes/common";

import Joi from "joi";

import {IDatabase} from "../db";
import {IAuthService} from "../services";
import {decodeRefreshToken, encodeAccessToken, encodeRefreshToken, generateClaims} from "../utils";
import {Account, AccountToken} from "../models";
import {RouteOptionsValidate} from "@hapi/hapi";
import P from "pino";

/**
 * Parameter body for `login`
 */
export type LoginRequest = {
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
export type LoginResponse = {
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
export type RegisterRequest = {
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
export type RegisterResponse = {
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
export type RefreshRequest = {
  /**
   * Refresh token to generate a new access token for
   */
  token: string;
}

/**
 * Result from `refresh`
 */
export type RefreshResponse = {
  /**
   * Access token to authenticate requests with
   */
  access_token: string;
}

export interface IAuthController {
  /**
   * Login authenticates the provided credentials
   * @param logger {Logger} Logger reference to use with this controller
   * @param req {LoginRequest} a pre-validated login request
   * @return {Res<LoginResponse>} response payload
   */
  login(logger: P.Logger, req: LoginRequest): Promise<Res<LoginResponse>>;
  get loginValidate(): RouteOptionsValidate | undefined;

  /**
   * Register creates a new account with the provided parameters
   * @param logger {Logger} Logger reference to use with this controller
   * @param req {RegisterRequest} a pre-validated register request
   * @return {Res<LoginResponse>} response payload
   */
  register(logger: P.Logger, req: RegisterRequest): Promise<Res<RegisterResponse>>;
  get registerValidate(): RouteOptionsValidate | undefined;

  /**
   * Refresh generates a new access token using the provided refresh token
   * @param logger {Logger} Logger reference to use with this controller
   * @param req {RefreshRequest} a pre-validated refresh request object
   * @return {Res<RefreshResponse>} response payload
   */
  refresh(logger: P.Logger, req: RefreshRequest): Promise<Res<RefreshResponse>>;
  get refreshValidate(): RouteOptionsValidate | undefined;
}

/**
 * Authentication controller implementing routes
 */
export class AuthController implements IAuthController {
  public constructor(private readonly db: IDatabase, private readonly authService: IAuthService) {
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.refresh = this.refresh.bind(this);
  }

  public get loginValidate(): RouteOptionsValidate | undefined {
    return {
      payload: Joi.object().keys({
        email: Joi.string().email().min(3).max(256).required(),
        password: Joi.string().min(8).max(128).required(),
      })
    };
  }
  /**
   * Login authenticates the provided credentials
   * @param logger {Logger} Logger reference to use with this controller
   * @param req {LoginRequest} a pre-validated login request
   * @return {Res<LoginResponse>} response payload
   */
  public async login(logger: P.Logger, req: LoginRequest): Promise<Res<LoginResponse>> {
    const {email, password} = req;

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

  get registerValidate(): RouteOptionsValidate | undefined {
    return {
      payload: Joi.object().keys({
        name: Joi.string().min(1).max(64).required(),
        email: Joi.string().email().min(3).max(256).required(),
        password: Joi.string().min(8).max(128).required(),
      })
    };
  }

  /**
   * Register creates a new account with the provided parameters
   * @param logger {Logger} Logger reference to use with this controller
   * @param req {RegisterRequest} a pre-validated register request
   * @return {Res<LoginResponse>} response payload
   */
  public async register(logger: P.Logger, req: RegisterRequest): Promise<Res<RegisterResponse>> {
    const { email, password, name } = req;

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

  get refreshValidate(): RouteOptionsValidate | undefined {
    return {
      payload: Joi.object().keys({
        token: Joi.string().required(),
      })
    };
  }

  /**
   * Refresh generates a new access token using the provided refresh token
   * @param logger {Logger} Logger reference to use with this controller
   * @param req {RefreshRequest} a pre-validated refresh request object
   * @return {Res<RefreshResponse>} response payload
   */
  public async refresh(logger: P.Logger, req: RefreshRequest): Promise<Res<RefreshResponse>> {
    const { token } = req;

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
