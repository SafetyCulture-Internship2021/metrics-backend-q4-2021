import {Tx} from "./transaction";

/**
 * Integration tests
 *
 * @group unit
 * @group unit/db/transaction
 */
describe("transaction", () => {
  describe("commit", () => {
    it("executes the commit command once and releases the conn", async () => {
      const poolConn = {
        query: jest.fn().mockResolvedValue(undefined),
        release: jest.fn()
      };

      const tx = new Tx(poolConn);

      await tx.commit();
      expect(poolConn.query).toHaveBeenCalledTimes(1);
      expect(poolConn.query).toHaveBeenCalledWith("COMMIT");
      expect(poolConn.release).toHaveBeenCalledTimes(1);

      await tx.commit();
      expect(poolConn.query).toHaveBeenCalledTimes(1);
      expect(poolConn.release).toHaveBeenCalledTimes(1);
    });
  });

  describe("rollback", () => {
    it("executes the rollback command once and releases the conn", async () => {
      const poolConn = {
        query: jest.fn().mockResolvedValue(undefined),
        release: jest.fn()
      };

      const tx = new Tx(poolConn);

      await tx.rollback();
      expect(poolConn.query).toHaveBeenCalledTimes(1);
      expect(poolConn.query).toHaveBeenCalledWith("ROLLBACK");
      expect(poolConn.release).toHaveBeenCalledTimes(1);

      await tx.rollback();
      expect(poolConn.query).toHaveBeenCalledTimes(1);
      expect(poolConn.release).toHaveBeenCalledTimes(1);
    });
  });
})
