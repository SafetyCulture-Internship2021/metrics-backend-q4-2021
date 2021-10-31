import type {ITx} from "./transaction";
import type {IPool} from "./types";

import {Tx} from "./transaction";

/**
 * A database reference
 */
export interface IDatabase {
  /**
   * Commence a transaction from this database
   * @return {Promise<Tx>} the initialised transaction object
   */
  tx(): Promise<ITx>

  /**
   * An initialised database pool ref
   * @return {IPool} the pool reference
   */
  get pool(): IPool
}

/**
 * A concrete IDatabase implementation
 */
export class Database implements IDatabase {
    /**
     * Constructor
     * @param pool {IPool} initialized postgres database pool
     */
    public constructor(public readonly pool: IPool) {
      this.tx = this.tx.bind(this);
    }

    /**
     * Commence a transaction from this database
     * @return {Promise<Tx>} the initialised transaction object
     */
    public async tx(): Promise<ITx> {
        const conn = await this.pool.connect();
        await conn.query("BEGIN TRANSACTION");
        return new Tx(conn)
    }
}
