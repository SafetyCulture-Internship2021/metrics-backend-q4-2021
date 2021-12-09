import Boom from "@hapi/boom";
import Joi from "joi";

import {decodeRefreshToken, encodeAccessToken, encodeRefreshToken, generateClaims} from "../utils";

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
 * Authentication routes and handlers
 */
export class AuthHandlers {
  constructor({
                db,
                authDao
              }) {
    this.db = db;
    this.authDao = authDao;

    this.routes = this.routes.bind(this);

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.register = this.register.bind(this);
    this.refresh = this.refresh.bind(this);
    this.context = this.context.bind(this);
  }

  routes(svc) {
    svc.route({
      method: "POST",
      path: "/auth/login",
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
      path: "/auth/logout",
      handler: this.logout
    })

    svc.route({
      method: "POST",
      path: "/auth/register",
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
      path: "/auth/refresh",
      handler: this.refresh,
      options: {
        auth: false,
        validate: {
          payload: refreshSchema
        }
      }
    });

    svc.route({
      method: "GET",
      path: "/auth/context",
      handler: this.context,
    })
  }

  /**
   * Login authenticates the provided credentials
   * @param req {Request} a hapi request object
   * @param h {Object} a hapi response toolkit
   * @return {Promise<Object>} response payload
   */
  async login(req, h) {
    const logger = req.logger;
    const {email, password} = req.payload;

    const tx = await this.db.tx()

    let account;
    try {
      account = await this.authDao.fetchAccountByLogin({
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

    let token;
    try {
      token = await this.authDao.createAccountToken(account.id, {
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

  async logout(req, h) {
    const {credentials} = req.auth;

    try {
      await this.authDao.deleteAccountToken(credentials.token_id);
    } catch (err) {
      // Swallow errors
    }

    return h.response().code(204);
  }

  /**
   * Register creates a new account with the provided parameters
   * @param req {Request} a hapi request object
   * @param h {Object} a hapi response toolkit
   * @return {Promise<Object>} response payload
   */
  async register(req, h) {
    const logger = req.logger;
    const {email, password, name} = req.payload;

    const tx = await this.db.tx();

    let account;
    try {
      account = await this.authDao.createAccount({
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

    let token;
    try {
      token = await this.authDao.createAccountToken(account.id, {
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
   * Refresh generates a new access token using the provided refresh token
   * @param req {Request} a hapi request object
   * @param h {Object} a hapi response toolkit
   * @return {Promise<Object>} response payload
   */
  async refresh(req, h) {
    const logger = req.logger;
    const {token} = req.payload;

    if (!token) {
      return Boom.unauthorized();
    }

    let decoded;
    try {
      decoded = await decodeRefreshToken(token);
    } catch {
      return Boom.unauthorized();
    }

    const tx = await this.db.tx();
    let accountToken;
    try {
      accountToken = await this.authDao.fetchAccountToken(decoded.id, {tx});
    } catch (err) {
      await tx.rollback();
      logger.error(`Failed to fetch token: ${err}`, err);
      return Boom.internal();
    }

    if (!accountToken) {
      // if fetchAccountToken has returned undefined, the token isn't valid
      return Boom.unauthorized();
    }

    let account;
    try {
      account = await this.authDao.fetchAccount(accountToken.account_id, {tx});
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

  /**
   * Context will return a decoded version of the users current context
   * @param req {Request} a hapi request object
   * @param h {Object} a hapi response toolkit
   * @return {Promise<Object>} response payload
   */
  async context(req, h) {
    // Just return the decoded credentials to show what will be available
    return req.auth.credentials;
  }
}
