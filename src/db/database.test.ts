/**
 * Database tests
 *
 * @group unit
 * @group unit/db/database
 */

import {IPool, IPoolConnection} from "./types";
import {Database} from "./database";

describe("database", () => {
  describe("tx", () => {
    it("initialises a new transaction", async () => {
      const poolConn: IPoolConnection = {
        query: jest.fn(),
        release: jest.fn()
      }

      const pool: IPool = {
        connect: jest.fn().mockResolvedValue(poolConn),
        query: jest.fn()
      };

      const db = new Database(pool);
      const tx = await db.tx();
      expect(tx).toBeDefined();
      expect(pool.connect).toHaveBeenCalled();
      expect(poolConn.query).toHaveBeenCalledWith("BEGIN TRANSACTION");
    });
  });
});

