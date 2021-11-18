import {v4 as uuid} from "uuid";

import {ensureConn} from "./common";
import {hashPassword, verifyPassword} from "../utils";
import {DBError, DBErrorCode} from "../db";

/**
 * Authentication service
 */
export class AuthDao {
  /**
   * @param database {Database} reference to the database
   */
  constructor(database) {
    this.database = database;
    this.createAccount = this.createAccount.bind(this);
    this.fetchAccountByLogin = this.fetchAccountByLogin.bind(this);
    this.fetchAccount = this.fetchAccount.bind(this);
    this.createAccountToken = this.createAccountToken.bind(this);
    this.fetchAccountToken = this.fetchAccountToken.bind(this);
    this.deleteAccountToken = this.deleteAccountToken.bind(this):
  }

  /**
   * Creates a new account with the supplied parameters
   * @param params {Object} parameters to be used in the creation of a new account
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {Account} created account
   */
  async createAccount(params, opts) {
    const conn = ensureConn(this.database, opts);
    const hash = await hashPassword(params.password);

    let rows;
    try {
      const {rows: queryRows} = await conn.query(`
        INSERT INTO accounts(id, email, hash, name)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [uuid(), params.email, hash, params.name]);
      rows = queryRows;

      if (rows.length != 1) {
        return;
      }

      return rows[0]
    } catch (err) {
      if (err.code === DBErrorCode.Conflict) {
        return;
      }
      throw err;
    }
  }

  /**
   * Fetch an account by their email address and password
   * @param params {Object} parameters to be used to fetch an account with
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {Account} found account
   */
  async fetchAccountByLogin(params, opts) {
    const {email, password} = params;
    const conn = ensureConn(this.database, opts);

    const {rows} = await conn.query(`
      SELECT *
      FROM accounts
      WHERE email = $1
    `, [email]);

    if (rows.length === 0) {
      return;
    }

    const isValid = verifyPassword(password, rows[0].hash);
    if (!isValid) {
      return;
    }

    return rows[0];
  }

  /**
   * Fetch an account by its id
   * @param id {string} UUID of the account
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {Account} found account
   */
  async fetchAccount(id, opts) {
    const conn = ensureConn(this.database, opts);

    const {rows} = await conn.query(`
        SELECT *
        FROM accounts
        WHERE id = $1
      `, [id]);

    return rows.length >= 1 ? rows[0] : undefined;
  }

  /**
   * Create a new token for a specified account
   * @param account_id {string} UUID of the account to create this token for
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {AccountToken} created account token
   */
  async createAccountToken(account_id, opts) {
    const conn = ensureConn(this.database, opts);

    const {rows} = await conn.query(`
      INSERT INTO account_tokens(id, account_id)
      VALUES ($1, $2)
      RETURNING *
    `, [uuid(), account_id]);

    if (rows.length != 1) {
      throw new Error(
        `invalid number of rows returned from insert operation: expected 1, received: ${rows.length}`);
    }

    return rows[0];
  }

  /**
   * Fetch an account token by its id
   * @param id {string} UUID of the token
   * @param opts {Object} options for this service function call
   * @return {AccountToken} found account token
   */
  async fetchAccountToken(id, opts) {
    const conn = ensureConn(this.database, opts);

    const {rows} = await conn.query(`
      SELECT *
      FROM account_tokens
      WHERE id = $1
    `, [id]);

    return rows.length >= 1 ? rows[0] : undefined;
  }

  /**
   * Deletes an account token by id
   * @param id {string} UUID of the token
   * @param opts {Object} options for this service function call
   * @return {void} nothing
   */
  async deleteAccountToken(id, opts) {
    const conn = ensureConn(this.database, opts);

    await conn.query(`
      DELETE
      FROM account_tokens
      WHERE id = $1
    `, [id]);
  }
}
