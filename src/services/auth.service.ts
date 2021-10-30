import type {Database} from "../db";
import type {Account, AccountToken} from "../models";

import {v4 as uuid} from "uuid";

import {ensureConn, ServiceCallOpts} from "./common";
import {hashPassword, verifyPassword} from "../utils";
import {DBError, DBErrorCode} from "../db/types";

/**
 * Parameters for `createAccount`
 */
type CreateAccountParams = {
  /**
   * email address of the account
   */
  email: string;
  /**
   * the password of the account
   */
  password: string;
  /**
   * the display name of the account
   */
  name: string;
};

/**
 * Parameters for `fetchAccountByLogin`
 */
type FetchAccountByLoginParams = {
  /**
   * email address to fetch
   */
  email: string;

  /**
   * password that should be valid
   */
  password: string;
}

/**
 * Authentication service
 */
export class AuthService {
  /**
   * @param database {Database} reference to the database
   */
  constructor(private readonly database: Database) {
    this.createAccount = this.createAccount.bind(this);
    this.fetchAccountByLogin = this.fetchAccountByLogin.bind(this);
    this.fetchAccount = this.fetchAccount.bind(this);
    this.createAccountToken = this.createAccountToken.bind(this);
    this.fetchAccountToken = this.fetchAccountToken.bind(this);
  }

  /**
   * Creates a new account with the supplied parameters
   * @param params {CreateAccountParams} parameters to be used in the creation of a new account
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {Account} created account
   */
  async createAccount(params: CreateAccountParams, opts?: ServiceCallOpts): Promise<Account | undefined> {
    const conn = await ensureConn(this.database, opts);
    const hash = await hashPassword(params.password);

    let rows: Account[];
    try {
      const {rows: queryRows} = await conn.query<Account>(`
        INSERT INTO accounts(id, email, hash, name)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [uuid(), params.email, hash, params.name]);
      rows = queryRows;

      if (rows.length != 1) {
        throw new Error(
          `invalid number of rows returned from insert operation: expected 1, received: ${rows.length}`);
      }

      return rows[0]
    } catch (err) {
      const dbErr = err as DBError;

      if (dbErr.code === DBErrorCode.Conflict) {
        return;
      }
      throw err;
    }
  }

  /**
   * Fetch an account by their email address and password
   * @param params {FetchAccountByLoginParams} parameters to be used to fetch an account with
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {Account} found account
   */
  async fetchAccountByLogin(params: FetchAccountByLoginParams, opts?: ServiceCallOpts): Promise<Account | undefined> {
    const {email, password} = params;
    const conn = await ensureConn(this.database, opts);

    const {rows} = await conn.query<Account>(`
      SELECT *
      FROM accounts
      WHERE email = $1
    `, [email]);

    if (rows.length === 0) {
      return;
    }
    console.log(password);
    console.log(rows[0].hash);

    const isValid = verifyPassword(password, rows[0].hash);
    if (!isValid) {
      return;
    }

    return rows[0];
  }

  /**
   * Create a new token for a specified account
   * @param account_id {string} UUID of the account to create this token for
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {AccountToken} created account token
   */
  async createAccountToken(account_id: string, opts?: ServiceCallOpts): Promise<AccountToken> {
    const conn = await ensureConn(this.database, opts);

    const {rows} = await conn.query<AccountToken>(`
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
   * Fetch an account by its id
   * @param id {string} UUID of the account
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {Account} found account
   */
  async fetchAccount(id: string, opts?: ServiceCallOpts): Promise<Account | undefined> {
      const conn = await ensureConn(this.database, opts);

      const {rows} = await conn.query<Account>(`
        SELECT *
        FROM accounts
        WHERE id = $1
      `, [id]);

      return rows.length >= 1 ? rows[0] : undefined;
  }

  /**
   * Fetch an account token by its id
   * @param id {string} UUID of the token
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {AccountToken} found account token
   */
  async fetchAccountToken(id: string, opts?: ServiceCallOpts): Promise<AccountToken | undefined> {
    const conn = await ensureConn(this.database, opts);

    const {rows} = await conn.query<AccountToken>(`
      SELECT *
      FROM account_tokens
      WHERE id = $1
    `, [id]);

    return rows.length >= 1 ? rows[0] : undefined;
  }
}
