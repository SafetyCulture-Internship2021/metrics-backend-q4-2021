/**
 * Auth service tests
 */
import {install as installClock, InstalledClock} from "@sinonjs/fake-timers";
import {AuthService} from "./auth.service";
import {DBErrorCode, ITx} from "../db";

jest.mock("uuid", () => ({
  v4: () => "eeced720-1648-4711-b726-9d281e735c68"
}));
jest.mock("../utils", () => ({
  hashPassword: (plaintext: string) => "hashed" + plaintext,
  verifyPassword: (pass: string, hash: string): boolean => {
    return pass === "validpassword";
  },
}));

describe("auth.service", () => {
  let clock: InstalledClock;

  beforeAll(() => {
    clock = installClock({now: new Date(Date.UTC(2020, 0, 1))});
  })

  /**
   * Auth service unit tests
   *
   * @group unit
   * @group unit/services/auth
   */
  describe("unit", () => {
    let tx: {
      conn: {
        query: jest.Mock;
      };
      commit?: jest.Mock;
      rollback?: jest.Mock;
    };
    let db;
    let service: AuthService;

    beforeEach(() => {
      tx = {
        conn: {
          query: jest.fn()
        },
        commit: jest.fn(),
        rollback: jest.fn()
      };

      db = {
        pool: {
          query: jest.fn(),
          connect: jest.fn()
        },
        tx: jest.fn()
      };

      service = new AuthService(db);
    });

    describe("createAccount", () => {
      it("should create an account successfully", async () => {
        tx.conn.query.mockResolvedValue({
          rows: [{
            id: "eeced720-1648-4711-b726-9d281e735c68",
            email: "john.smith@example.com",
            hash: "hashedpassword",
            name: "John Smith",
            created_at: new Date()
          }]
        });

        const account = await service.createAccount({
          email: "john.smith@example.com",
          password: "password",
          name: "John Smith"
        }, { tx: tx as ITx });

        expect(account).toStrictEqual({
          id: "eeced720-1648-4711-b726-9d281e735c68",
          email: "john.smith@example.com",
          hash: "hashedpassword",
          name: "John Smith",
          created_at: new Date()
        });
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "eeced720-1648-4711-b726-9d281e735c68",
          "john.smith@example.com",
          "hashedpassword",
          "John Smith"
        ]);
      });
      it("should return undefined if an incorrect number of results are found", async () => {
        tx.conn.query.mockResolvedValue({
          rows: []
        });
        const account = await service.createAccount({
          email: "john.smith@example.com",
          password: "password",
          name: "John Smith"
        }, { tx: tx as ITx });

        expect(account).toBeUndefined()
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "eeced720-1648-4711-b726-9d281e735c68",
          "john.smith@example.com",
          "hashedpassword",
          "John Smith"
        ]);
      });
      it("should return undefined if a conflict error has been encountered", async () => {
        tx.conn.query.mockRejectedValue({
          code: DBErrorCode.Conflict
        });
        const account = await service.createAccount({
          email: "john.smith@example.com",
          password: "password",
          name: "John Smith"
        }, { tx: tx as ITx });

        expect(account).toBeUndefined()
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "eeced720-1648-4711-b726-9d281e735c68",
          "john.smith@example.com",
          "hashedpassword",
          "John Smith"
        ]);
      });
      it("should throw an error if any other database error is encountered", async () => {
        tx.conn.query.mockRejectedValue(new Error("boom"));
        try {
          await service.createAccount({
            email: "john.smith@example.com",
            password: "password",
            name: "John Smith"
          }, { tx: tx as ITx });

          // If we've reached this line, we didn't throw
          expect(true).toBe(false);
        } catch (err) {
          expect(err).toBeDefined()
        }
      });
    });

    describe("fetchAccount", () => {
      it("should return an account", async () => {
        tx.conn.query.mockResolvedValue({
          rows: [{
            id: "eeced720-1648-4711-b726-9d281e735c68",
            email: "john.smith@example.com",
            hash: "hashedpassword",
            name: "John Smith",
            created_at: new Date()
          }]
        });
        const account = await service.fetchAccount("account-id-fake", { tx: tx as ITx });

        expect(account).toStrictEqual({
          id: "eeced720-1648-4711-b726-9d281e735c68",
          email: "john.smith@example.com",
          hash: "hashedpassword",
          name: "John Smith",
          created_at: new Date()
        })
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "account-id-fake"
        ]);
      });

      it("should return undefined if an invalid number of rows are found", async () => {
        tx.conn.query.mockResolvedValue({
          rows: []
        });
        const account = await service.fetchAccount("account-id-fake", { tx: tx as ITx });

        expect(account).toBeUndefined()
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "account-id-fake"
        ]);
      });

      it("should throw an error if any database error is encountered", async () => {
        tx.conn.query.mockRejectedValue(new Error("boom"));
        try {
          await service.fetchAccount("account-id-fake", { tx: tx as ITx });

          // If we've reached this line, we didn't throw
          expect(true).toBe(false);
        } catch (err) {
          expect(err).toBeDefined()
        }
      })
    });

    describe("fetchAccountByLogin", () => {
      it("should return an account successfully", async () => {
        tx.conn.query.mockResolvedValue({
          rows: [{
            id: "eeced720-1648-4711-b726-9d281e735c68",
            email: "john.smith@example.com",
            hash: "hashedpassword",
            name: "John Smith",
            created_at: new Date()
          }]
        });

        const account = await service.fetchAccountByLogin({
          email: "john.smith@example.com",
          password: "validpassword",
        }, { tx: tx as ITx });

        expect(account).toStrictEqual({
          id: "eeced720-1648-4711-b726-9d281e735c68",
          email: "john.smith@example.com",
          hash: "hashedpassword",
          name: "John Smith",
          created_at: new Date()
        });
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "john.smith@example.com",
        ]);
      });

      it("should return undefined if no rows are returned", async () => {
        tx.conn.query.mockResolvedValue({
          rows: []
        });

        const account = await service.fetchAccountByLogin({
          email: "john.smith@example.com",
          password: "validpassword",
        }, { tx: tx as ITx });

        expect(account).toBeUndefined();
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "john.smith@example.com",
        ]);
      });

      it("should return undefined if the password is not verified", async () => {
        tx.conn.query.mockResolvedValue({
          rows: [{
            id: "eeced720-1648-4711-b726-9d281e735c68",
            email: "john.smith@example.com",
            hash: "hashedpassword",
            name: "John Smith",
            created_at: new Date()
          }]
        });

        const account = await service.fetchAccountByLogin({
          email: "john.smith@example.com",
          password: "invalidpassword",
        }, { tx: tx as ITx });

        expect(account).toBeUndefined();
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "john.smith@example.com",
        ]);
      });

      it("should throw an error if any other database error is encountered", async () => {
        tx.conn.query.mockRejectedValue(new Error("boom"));
        try {
          await service.fetchAccountByLogin({
            email: "john.smith@example.com",
            password: "invalidpassword",
          }, { tx: tx as ITx });

          // If we've reached this line, we didn't throw
          expect(true).toBe(false);
        } catch (err) {
          expect(err).toBeDefined()
        }
      });
    });

    describe("createAccountToken", () => {
      it("should create an account token successfully", async () => {
        tx.conn.query.mockResolvedValue({
          rows: [{
            id: "eeced720-1648-4711-b726-9d281e735c68",
            account_id: "eeced720-1648-4711-b726-9d281e735c68",
            created_at: new Date()
          }]
        });

        const token = await service.createAccountToken("eeced720-1648-4711-b726-9d281e735c68", { tx: tx as ITx });

        expect(token).toStrictEqual({
          id: "eeced720-1648-4711-b726-9d281e735c68",
          account_id: "eeced720-1648-4711-b726-9d281e735c68",
          created_at: new Date()
        });
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "eeced720-1648-4711-b726-9d281e735c68",
          "eeced720-1648-4711-b726-9d281e735c68",
        ]);
      });

      it("should return undefined when no results are returned", async () => {
        tx.conn.query.mockResolvedValue({
          rows: []
        });

        try {
          await service.createAccountToken("eeced720-1648-4711-b726-9d281e735c68", {
            tx: tx as ITx });

          // If we've reached this line, we didn't throw
          expect(true).toBe(false);
        } catch (err) {
          // @ts-ignore
          const {message} = err;
          expect(message).toBe("invalid number of rows returned from insert operation: expected 1, received: 0")
        }
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "eeced720-1648-4711-b726-9d281e735c68",
          "eeced720-1648-4711-b726-9d281e735c68",
        ]);
      });

      it("should throw an error if any other database error is encountered", async () => {
        tx.conn.query.mockRejectedValue(new Error("boom"));
        try {
          await service.createAccountToken("eeced720-1648-4711-b726-9d281e735c68", {
            tx: tx as ITx });

          // If we've reached this line, we didn't throw
          expect(true).toBe(false);
        } catch (err) {
          expect(err).toBeDefined()
        }
      })
    });

    describe("fetchAccountToken", () => {
      it("should fetch an account token successfully", async () => {
        tx.conn.query.mockResolvedValue({
          rows: [{
            id: "eeced720-1648-4711-b726-9d281e735c68",
            account_id: "eeced720-1648-4711-b726-9d281e735c68",
            created_at: new Date()
          }]
        });

        const token = await service.fetchAccountToken("eeced720-1648-4711-b726-9d281e735c68", { tx: tx as ITx });

        expect(token).toStrictEqual({
          id: "eeced720-1648-4711-b726-9d281e735c68",
          account_id: "eeced720-1648-4711-b726-9d281e735c68",
          created_at: new Date()
        });
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "eeced720-1648-4711-b726-9d281e735c68",
        ]);
      });

      it("should return undefined if no rows are returned", async () => {
        tx.conn.query.mockResolvedValue({
          rows: []
        });

        const token = await service.fetchAccountToken("eeced720-1648-4711-b726-9d281e735c68", { tx: tx as ITx });

        expect(token).toBeUndefined();
        expect(tx.conn.query).toHaveBeenCalledWith(expect.anything(), [
          "eeced720-1648-4711-b726-9d281e735c68",
        ]);
      });

      it("should throw an error if any database error is encountered", async () => {
        tx.conn.query.mockRejectedValue(new Error("boom"));
        try {
          await service.fetchAccountToken("eeced720-1648-4711-b726-9d281e735c68", { tx: tx as ITx });

          // If we've reached this line, we didn't throw
          expect(true).toBe(false);
        } catch (err) {
          expect(err).toBeDefined()
        }
      })
    });
  });

  /**
   * Auth service integration tests
   *
   * @group integration
   * @group integration/services/auth
   */
  // describe("integration", () => {
  //   describe("createAccount", () => {
  //
  //   });
  //
  //   describe("fetchAccountByLogin", () => {
  //
  //   });
  //
  //   describe("createAccountToken", () => {
  //
  //   });
  //
  //   describe("fetchAccount", () => {
  //
  //   });
  //
  //   describe("fetchAccountToken", () => {
  //
  //   });
  // });
})
