import type {
  QueryConfig,
  QueryResult,
  QueryResultRow,
} from "pg";

/**
 * DBErrorCode defines the error codes that can be expected to be returned from the DB
 */
export const DBErrorCode = Object.seal({
  /**
   * Conflict error code, typically thrown on primary key or unique constraint violations
   */
  Conflict: '23505'
})

/**
 * DBError wraps the existing JS error type with the addition context provided by the 'pg' library
 */
export type DBError = Error & {
  /**
   * Specific error code that has been thrown from the internal library, error codes are found in the DBErrorCode type
   */
  code?: string;
  /**
   * The schema this error relates to
   */
  schema?: string;
  /**
   * The table this error relates to
   */
  table?: string;
  /**
   * The column this error relates to
   */
  column?: string;
  /**
   * The constraint this error relates to
   */
  constraint?: string;
}

/**
 * IQueryable defines the shape of a DB query function call
 */
export interface IQueryable {
  /**
   * Query will execute the given query text with the supplied values against the connection
   * @param queryTextOrConfig {string} the query text to execute
   * @param values {any[]} the positional values to supply
   * @return {QueryResult<R>>} a query result of the supplied row type
   */
  query<R extends QueryResultRow = any, I extends any[] = any[]>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: I,
  ): Promise<QueryResult<R>>;
}

/**
 * IPoolConnection defines the functionality required by a single pool connection
 */
export interface IPoolConnection extends IQueryable {
  /**
   * release will return this connection to the connection pool
   */
  release(): void;
}

/**
 * IPool is a wrapper interface to allow for generic usage of the DB without being locked to the 'pg' library
 */
export interface IPool extends IQueryable {
  /**
   * connect will fetch a new connection from the pool
   * @return {IPoolConnection} pool connection instance
   */
  connect(): Promise<IPoolConnection>;
}
