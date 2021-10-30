import type {Request, ResponseToolkit, Server} from "@hapi/hapi";
import type {Res} from "./common";

import Joi from "joi";

import {Database} from "../db";
import {AuthService} from "../services";
import {encodeAccessToken, encodeRefreshToken, generateClaims} from "../utils/token";

const loginSchema = Joi.object().keys({
  email: Joi.string().email().min(3).max(256).required(),
  password: Joi.string().min(8).max(128).required()
});
const registerSchema = Joi.object().keys({
  name: Joi.string().min(1).max(64).required(),
  email: Joi.string().email().min(3).max(256).required(),
  password: Joi.string().min(8).max(128).required(),
});

/**
 * Parameter body for `login`
 */
type LoginRequest = {
  /**
   *
   */
  email: string;
  /**
   *
   */
  password: string
};

/**
 * Result from `login`
 */
type LoginResponse = {
  /**
   *
   */
  refresh_token: string;
  /**
   *
   */
  access_token: string;
};

/**
 * Parameter body for `register`
 */
type RegisterRequest = {
  /**
   *
   */
  email: string;
  /**
   *
   */
  password: string;
  /**
   *
   */
  name: string
}

/**
 * Result from `register`
 */
type RegisterResponse = {
  /**
   *
   */
  refresh_token: string;
  /**
   *
   */
  access_token: string;
};

export class AuthController {
  public constructor(private readonly db: Database, private readonly authService: AuthService) {
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
  }

  /**
   * register the routes from this controller with hapi
   * @param svc {Server} hapi service reference
   */
  public registerRoutes(svc: Server) {
    svc.route({
      method: "POST",
      path: "/login",
      handler: this.login,
      options: {
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
        validate: {
          payload: registerSchema
        }
      }
    });
  }

  /**
   * @private
   * Login authenticates the provided credentials
   * @param req {Request} hapi request object
   * @param h {ResponseToolkit} hapi response toolkit
   * @return {Res<LoginResponse>} response payload
   */
  private async login(req: Request, h: ResponseToolkit): Promise<Res<LoginResponse>> {
    const { email, password } = req.payload as LoginRequest;

    const tx = await this.db.tx()

    const account = await this.authService.fetchAccountByLogin({ email, password}, {
      tx
    });
    if (!account) {
      await tx.rollback()
      return h.response().code(401);
    }

    const token = await this.authService.createAccountToken(account.id, {
      tx
    });

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
    const { email, password, name } = req.payload as RegisterRequest;

    const tx = await this.db.tx();

    const account = await this.authService.createAccount({
      email,
      password,
      name
    });

    const token = await this.authService.createAccountToken(account.id, {
      tx
    });

    await tx.commit();

    return {
      refresh_token: await encodeRefreshToken(token),
      access_token: await encodeAccessToken(generateClaims(account, token))
    };
  }
}
