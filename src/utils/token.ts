import config from "config";
import jwt from "jsonwebtoken";

import Joi from "joi";
import {Account, AccountToken} from "../models";

/**
 * JWT Claims set
 */
export type Claims = {
  /**
   * UUID of the account this token is valid for
   */
  account_id: string;
  /**
   * Display name of the account
   */
  account_name: string;
  /**
   * Email address of the account
   */
  account_email: string;
  /**
   * UUID of this token
   */
  token_id: string;
};
export const claimsSchema = Joi.object().keys({
  account_id: Joi.string().uuid().required(),
  account_name: Joi.string().required(),
  account_email: Joi.string().email().required(),
  token_id: Joi.string().uuid().required()
});

/**
 * Generates a claims object from the supplied account and token
 * @param account {Account} account to extract claims from
 * @param token {AccountToken} token to extract claims from
 */
export function generateClaims(account: Account, token: AccountToken): Claims {
  return {
    account_id: account.id,
    account_name: account.name,
    account_email: account.email,
    token_id: token.id,
  };
}

/**
 * Encode an access token from a set of claims
 * @param claims {Claims} claim set to generate the token with
 * @return {Promise<string>} encoded JWT from the claims
 */
export function encodeAccessToken(claims: Claims): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    try {
      const tok = jwt.sign(claims, config.get('jwt.signingKey'), {
        algorithm: config.get('jwt.signingAlgorithm'),
        expiresIn: config.get('jwt.expiration'),
        audience: config.get('jwt.audience'),
        subject: config.get('jwt.subject'),
        issuer: config.get('jwt.issuer')
      });
      resolve(tok);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Encode a refresh token from an account token object
 * @param token {AccountToken} account token to encode
 * @return {Promise<string>} encoded refresh token
 */
export async function encodeRefreshToken(token: AccountToken): Promise<string> {
  return Buffer.from(JSON.stringify(token)).toString("base64");
}

/**
 * Decode a JWT string returning the claims within
 * @param token {string} The raw JWT to verify
 * @return {Promise<Claims>} claim set that was extracted from the token
 */
export function decodeAccessToken(token: string): Promise<Claims> {
  return new Promise((resolve, reject) => {
    try {
      const result = jwt.verify(token, config.get('jwt.signingKey'), {
        audience: config.get('jwt.audience'),
        subject: config.get('jwt.subject'),
        issuer: config.get('jwt.issuer')
      });

      const {value, error, warning} = claimsSchema.validate(result, {

      });

      if (error) {
        return reject(error);
      }
      if (warning) {
        return reject(warning);
      }

      return value as Claims;
    } catch (err) {
      return reject(err);
    }
  })
}

/**
 * Decode a refresh token returning the underlying account token
 * @param token {string} The raw refresh token to verify
 * @return {Promise<AccountToken>} account token extracted from the token
 */
export async function decodeRefreshToken(token: string): Promise<AccountToken> {
  return JSON.parse((Buffer.from(token, "base64").toString("utf-8"))) as AccountToken;
}
