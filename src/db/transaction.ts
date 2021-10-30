import type {PoolClient} from "pg";

/**
 * A pre-initialized database transaction helper
 */
export class Tx {
    /**
     * @private isFinalized represents whether or not this transaction has been finalized
     */
    private isFinalized: boolean = false;

    /**
     * @param conn {PoolClient} An initialized client from the DB pool
     */
    public constructor(public readonly conn: PoolClient) {
    }

    /**
     * Commit this transaction. This call is a noop if the transaction is already finalized.
     * @return {Promise<void>} a promise representing if the transaction commit
     */
    public async commit() {
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
    public async rollback() {
        // Noop for calling commit or rollback multiple times
        if (this.isFinalized) {
            return;
        }
        await this.conn.query("ROLLBACK");
        this.isFinalized = true;
        this.conn.release();
    }
}
