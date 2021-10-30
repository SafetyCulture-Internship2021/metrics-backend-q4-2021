import type {Pool} from "pg";
import {Tx} from "./transaction";

/**
 * A database reference
 */
export class Database {
    /**
     * Constructor
     * @param pool {Pool} initialized postgres database pool
     */
    public constructor(public readonly pool: Pool) {
      this.tx = this.tx.bind(this);
    }

    /**
     * Commence a transaction from this database
     * @return {Promise<Tx>} the initialised transaction object
     */
    public async tx(): Promise<Tx> {
        const conn = await this.pool.connect();
        await conn.query("BEGIN TRANSACTION");
        return new Tx(conn)
    }
}
