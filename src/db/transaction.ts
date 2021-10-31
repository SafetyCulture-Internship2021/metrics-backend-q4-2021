import type {PoolClient} from "pg";
import type {IPoolConnection, IQueryable} from "./types";

/**
 * A pre-initialized database transaction helper
 */
export interface ITx {
  /**
   * Commit this transaction. This call is a noop if the transaction is already finalized.
   * @return {Promise<void>} a promise representing if the transaction commit
   */
  commit(): Promise<void>;

  /**
   * Rollback this transaction. This call is a noop if the transaction is already finalized.
   * @return {Promise<void>} a promise representing if the transaction rolled back
   */
  rollback(): Promise<void>;

  /**
   * Queryable interface to perform queries against for the transaction
   * @return {IQueryable} the queryable reference
   */
  get conn(): IQueryable;
}

/**
 * A concrete ITx implementation
 */
export class Tx implements ITx {
    /**
     * @private isFinalized represents whether or not this transaction has been finalized
     */
    private isFinalized: boolean = false;

    /**
     * @param conn {PoolClient} An initialized client from the DB pool
     */
    public constructor(public readonly conn: IPoolConnection) {
    }

    /**
     * Commit this transaction. This call is a noop if the transaction is already finalized.
     * @return {Promise<void>} a promise representing if the transaction commit
     */
    public async commit(): Promise<void> {
        // Noop for calling commit or rollback multiple times
        if (this.isFinalized) {
            return;
        }
        await this.conn.query("COMMIT");
        this.isFinalized = true;
        this.conn.release();
    }

    /**
     * Rollback this transaction. This call is a noop if the transaction is already finalized.
     * @return {Promise<void>} a promise representing if the transaction rolled back
     */
    public async rollback(): Promise<void> {
        // Noop for calling commit or rollback multiple times
        if (this.isFinalized) {
            return;
        }
        await this.conn.query("ROLLBACK");
        this.isFinalized = true;
        this.conn.release();
    }
}
