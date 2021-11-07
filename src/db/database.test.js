import {Database} from "./database";

/**
 * Database tests
 *
 * @group unit
 * @group unit/db/database
 */
describe("database", () => {
  describe("tx", () => {
    it("initialises a new transaction", async () => {
      const poolConn = {
        query: jest.fn(),
        release: jest.fn()
      }

      const pool = {
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

