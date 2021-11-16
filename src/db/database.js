import {Tx} from "./transaction";

/**
 * A concrete IDatabase implementation
 */
export class Database {
    /**
     * Constructor
     * @param pool {Pool} initialized postgres database pool
     */
    constructor(pool) {
      this.pool = pool;

      this.tx = this.tx.bind(this);
    }

    /**
     * Commence a transaction from this database
     * @return {Promise<Object>} the initialised transaction object
     */
    async tx() {
        const conn = await this.pool.connect();
        await conn.query("BEGIN TRANSACTION");
        return new  Tx(conn)
    }
}
