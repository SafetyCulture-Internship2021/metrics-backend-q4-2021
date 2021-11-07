/**
 * A concrete ITx implementation
 */
export class Tx {
    /**
     * @param conn {Object} An initialized client from the DB pool
     */
    constructor(conn) {
      this.conn = conn;
      this.isFinalized = false;
      this.commit = this.commit.bind(this);
      this.rollback = this.rollback.bind(this);
    }

    /**
     * Commit this transaction. This call is a noop if the transaction is already finalized.
     * @return {Promise<void>} a promise representing if the transaction commit
     */
    async commit() {
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
    async rollback() {
        // Noop for calling commit or rollback multiple times
        if (this.isFinalized) {
            return;
        }
        await this.conn.query("ROLLBACK");
        this.isFinalized = true;
        this.conn.release();
    }
}
