import {AuthController} from "./auth.controllers";
import P, {pino} from "pino";
import {install as mockClock, InstalledClock} from "@sinonjs/fake-timers";
import { IAuthService } from "services";


describe("AuthController", () => {
  /**
   * Auth controller unit tests
   *
   * @group unit
   * @group unit/controllers/auth
   */
  describe("unit", () => {
    let clock: InstalledClock;
    let logger: P.Logger;
    // @ts-ignore
    let tx;
    let database;
    // @ts-ignore
    let service;
    let authController: AuthController;

    beforeAll(() => {
      clock = mockClock({
        now: new Date(Date.UTC(2020, 0, 1))
      });
      logger = pino({
        level: "silent"
      });
    })
    beforeEach(() => {
      tx = {
        conn: {
          query: jest.fn()
        },
        commit: jest.fn(),
        rollback: jest.fn()
      }
      database = {
        pool: {
          query: jest.fn(),
          connect: jest.fn()
        },
        tx: jest.fn().mockResolvedValue(tx),
      };
      service = {
        createAccount: jest.fn(),
        createAccountToken: jest.fn(),
        fetchAccount: jest.fn(),
        fetchAccountByLogin: jest.fn(),
        fetchAccountToken: jest.fn()
      };
      authController = new AuthController(database, service);
    });

    describe("login", () => {
      it("should login successfully", async () => {
        service.fetchAccountByLogin.mockResolvedValue({
          id: "eeced720-1648-4711-b726-9d281e735c68",
          email: "john.smith@example.com",
          hash: "hashedpassword",
          name: "John Smith",
          created_at: new Date()
        });
        service.createAccountToken.mockResolvedValue({
          id: "d76eaad0-6014-45a9-acb0-58639feff53f",
          account_id: "eeced720-1648-4711-b726-9d281e735c68",
          created_at: new Date()
        });

        const res = await authController.login(logger, {
          email: "john.smith@example.com",
          password: "password",
        });

        expect(service.fetchAccountByLogin).toBeCalledWith({
          email: "john.smith@example.com",
          password: "password",
        }, {
          tx
        });
        expect(service.createAccountToken).toBeCalledWith("eeced720-1648-4711-b726-9d281e735c68", {
          tx
        });
        expect(tx.commit).toHaveBeenCalled();
        expect(tx.rollback).not.toHaveBeenCalled();

        expect(res).toStrictEqual({
          refresh_token: "eyJpZCI6ImQ3NmVhYWQwLTYwMTQtNDVhOS1hY2IwLTU4NjM5ZmVmZjUzZiIsImFjY291bnRfaWQiOiJlZWNlZDcyMC0xNjQ4LTQ3MTEtYjcyNi05ZDI4MWU3MzVjNjgiLCJjcmVhdGVkX2F0IjoiMjAyMC0wMS0wMVQwMDowMDowMC4wMDBaIn0=",
          access_token: "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiZWVjZWQ3MjAtMTY0OC00NzExLWI3MjYtOWQyODFlNzM1YzY4IiwiYWNjb3VudF9uYW1lIjoiSm9obiBTbWl0aCIsImFjY291bnRfZW1haWwiOiJqb2huLnNtaXRoQGV4YW1wbGUuY29tIiwidG9rZW5faWQiOiJkNzZlYWFkMC02MDE0LTQ1YTktYWNiMC01ODYzOWZlZmY1M2YiLCJpYXQiOjE1Nzc4MzY4MDAsImV4cCI6MTU3NzgzNzEwMCwiYXVkIjoidGVzdCIsImlzcyI6InRlc3QiLCJzdWIiOiJ0ZXN0In0.jvhgL9kQMHiGtcIBTHmUAJiFt-twtIr6eIQo0_y_Wuvd_W8NMVfMUMZI_PZw6o678VU2LTlMH39NbPYs39h-gg"
        });
      });

      it("should throw internal when fetchAccountByLogin throws", async () => {

      });

      it("should throw unauthorized when fetchAccountByLogin returns no values", async () => {

      });

      it("should throw internal when createAccountToken throws", async () => {

      });
    });

    describe("register", () => {
      it("should register an account successfully", async () => {

      });

      it("should throw internal when createAccount throws", async () => {

      });

      it("should throw unauthorized when createAccount returns no values", async () => {

      });

      it("should throw internal when createAccountToken fails", async () => {

      });
    });

    describe("refresh", () => {
      it("should refresh with a token successfully", async () => {
      });

      it("should throw internal when fetchAccountToken throws", async () => {

      });

      it("should throw unauthorized when fetchAccountToken returns no values", async () => {

      });

      it("should throw internal when fetchAccount throws", async () => {

      });

      it("should throw unauthorized when fetchAccount returns no values", async () => {

      });
    });
  });
});
