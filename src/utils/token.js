import config from "config";
import jwt from "jsonwebtoken";

import Joi from "joi";

export const claimsSchema = Joi.object().keys({
  account_id: Joi.string().uuid().required(),
  account_name: Joi.string().required(),
  account_email: Joi.string().email().required(),
  token_id: Joi.string().uuid().required()
});

/**
 * Generates a claims object from the supplied account and token
 * @param account {Object} account to extract claims from
 * @param account.id {String} id of the account
 * @param account.name {String} name of the account
 * @param account.email {String} email of the account
 * @param token {Object} token to extract claims from
 * @param token.id {String} id of the token
 * @return {Object} generated claim object
 */
export function generateClaims(account, token) {
  return {
    account_id: account.id,
    account_name: account.name,
    account_email: account.email,
    token_id: token.id,
  };
}

/**
 * Encode an access token from a set of claims
 * @param claims {Object} claim set to generate the token with
 * @param claims.account_id {string} account id from the claims
 * @param claims.account_name {string} account name from the claims
 * @param claims.account_email {string} account email from the claims
 * @param claims.token_id {string} token id from the claims
 * @return {Promise<string>} encoded JWT from the claims
 */
export async function encodeAccessToken(claims) {
  return await new Promise((resolve, reject) => {
    try {
      const tok = jwt.sign(claims, config.get('jwt.signingKey'), {
        algorithm: 'HS512',
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
 * @param token {Object} account token to encode
 * @return {Promise<string>} encoded refresh token
 */
export async function encodeRefreshToken(token) {
  return Buffer.from(JSON.stringify(token)).toString("base64");
}

/**
 * Decode a JWT string returning the claims within
 * @param token {string} The raw JWT to verify
 * @return {Promise<Object>} claim set that was extracted from the token
 */
export async function decodeAccessToken(token) {
  return await new Promise((resolve, reject) => {
    console.log(token);
    jwt.verify(token, config.get('jwt.signingKey'), {
      algorithms: ['HS512'],
      audience: config.get('jwt.audience'),
      subject: config.get('jwt.subject'),
      issuer: config.get('jwt.issuer')
    }, (err, result) => {
      if (err) {
        console.error("jwt error: ", err);
        return reject(err);
      }

      const {value, error, warning} = claimsSchema.validate(result, {
        stripUnknown: true
      });

      if (error) {
        console.error("validation error: ", error);
        return reject(error);
      }

      return resolve(value);
    });
  });
}

/**
 * Decode a refresh token returning the underlying account token
 * @param token {string} The raw refresh token to verify
 * @return {Promise<Object>} account token extracted from the token
 */
export async function decodeRefreshToken(token) {
  return JSON.parse((Buffer.from(token, "base64").toString("utf-8")));
}
