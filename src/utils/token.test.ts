/**
 * Token tests
 *
 * @group unit
 * @group unit/utils/token
 */

// @ts-ignore
import config from "config";
// @ts-ignore
import jwt from "jsonwebtoken";
import {install as mockClock, InstalledClock} from "@sinonjs/fake-timers";

import {Account, AccountToken} from "../models";
import {decodeAccessToken, decodeRefreshToken, encodeAccessToken, encodeRefreshToken, generateClaims} from "./token";

const ValidJWT = "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiNTJhNzQ4ODUtNDA5OC00NmMzLTlhNDUtMTBhNzZlMjU4ODAwIiwiYWNjb3VudF9uYW1lIjoiSm9obiBTbWl0aCIsImFjY291bnRfZW1haWwiOiJqb2huLnNtaXRoQGV4YW1wbGUuY29tIiwidG9rZW5faWQiOiJlZWNlZDcyMC0xNjQ4LTQ3MTEtYjcyNi05ZDI4MWU3MzVjNjgiLCJpYXQiOjE1Nzc4MzY4MDAsImV4cCI6MTU3NzgzNzEwMCwiYXVkIjoidGVzdCIsImlzcyI6InRlc3QiLCJzdWIiOiJ0ZXN0In0.C_M9_N0NZ8zXtX2CtSFlTi5HKsGB_w4Nt0hD1ehpCE90xFKDnB2InAITkCClwzSZSoPkLgtEIIzQUmv5YjFhCQ";

describe("token", () => {
  let clock: InstalledClock;
  beforeAll(() => {
    clock = mockClock({
      now: new Date(Date.UTC(2020, 0, 1))
    });
  });

  afterAll(() => {
    clock.uninstall();
  });

  describe("generateClaims", () => {
    it("should generate a claims object successfully", () => {
      const account: Account = {
        id: "52a74885-4098-46c3-9a45-10a76e258800",
        email: "john.smith@example.com",
        // this is 'password' in plaintext
        hash: "$2b$12$PE01lbaDW9b5TWynQQIc6Oa7OEHWYQO3CL4qY4oRqDY/5gTwFSHfy",
        name: "John Smith",
        created_at: new Date(),
      };
      const token: AccountToken = {
        id: "eeced720-1648-4711-b726-9d281e735c68",
        account_id: "52a74885-4098-46c3-9a45-10a76e258800",
        // Midnight 1st Jan 2020
        created_at: new Date(),
      };

      const output = generateClaims(account, token);
      expect(output).toBeDefined();
      expect(output).toEqual({
        account_id: "52a74885-4098-46c3-9a45-10a76e258800",
        account_name: "John Smith",
        account_email: "john.smith@example.com",
        token_id: "eeced720-1648-4711-b726-9d281e735c68"
      });
    });
  });

  describe("encodeAccessToken", () => {
    it("should encode a token successfully", async () => {
      const token = await encodeAccessToken({
        account_id: "52a74885-4098-46c3-9a45-10a76e258800",
        account_name: "John Smith",
        account_email: "john.smith@example.com",
        token_id: "eeced720-1648-4711-b726-9d281e735c68"
      });

      expect(token).toBeDefined();
      expect(token).toBe(ValidJWT);
    });
  });

  describe("encodeRefreshToken",  () => {
    it("should encode a token successfully", async () => {
      const input: AccountToken = {
        id: "eeced720-1648-4711-b726-9d281e735c68",
        account_id: "52a74885-4098-46c3-9a45-10a76e258800",
        // Midnight 1st Jan 2020
        created_at: new Date(),
      };
      const output = await encodeRefreshToken(input);
      expect(output).toBeDefined();
      expect(output).toEqual("eyJpZCI6ImVlY2VkNzIwLTE2NDgtNDcxMS1iNzI2LTlkMjgxZTczNWM2OCIsImFjY291bnRfaWQiOiI1MmE3NDg4NS00MDk4LTQ2YzMtOWE0NS0xMGE3NmUyNTg4MDAiLCJjcmVhdGVkX2F0IjoiMjAyMC0wMS0wMVQwMDowMDowMC4wMDBaIn0=");
    });
  });

  describe("decodeAccessToken", () => {
    it("should decode a token successfully", async () => {
      const result = await decodeAccessToken(ValidJWT);
      expect(result).toBeDefined();
      expect(result).toStrictEqual({
        account_id: "52a74885-4098-46c3-9a45-10a76e258800",
        account_name: "John Smith",
        account_email: "john.smith@example.com",
        token_id: "eeced720-1648-4711-b726-9d281e735c68"
      })
    });

    it("should throw an error when an invalid token is supplied", async () => {
      const badToken = jwt.sign({
      }, "fakesigningkeythatsinvalid", {
        algorithm: 'HS512',
        expiresIn: config.get('jwt.expiration'),
        audience: config.get('jwt.audience'),
        subject: config.get('jwt.subject'),
        issuer: config.get('jwt.issuer')
      });
      try {
        const res = await decodeAccessToken(badToken)
        expect(res).not.toBeDefined();
      } catch (err) {
        // @ts-ignore
        const { message } = err;
        expect(message).toBe("invalid signature");
      }
    });

    it("should throw an error when required claims are missing from a valid token", async () => {
      const badToken = jwt.sign({
        account_id: "52a74885-4098-46c3-9a45-10a76e258800",
        account_name: "John Smith",
        account_email: "john.smith@example.com",
      }, config.get('jwt.signingKey'), {
        algorithm: 'HS512',
        expiresIn: config.get('jwt.expiration'),
        audience: config.get('jwt.audience'),
        subject: config.get('jwt.subject'),
        issuer: config.get('jwt.issuer')
      });
      try {
        const res = await decodeAccessToken(badToken)
        expect(res).not.toBeDefined();
      } catch (err) {
        // @ts-ignore
        const { message } = err;
        expect(message).toBe(`"token_id" is required`);
      }
    });
  });

  describe("decodeRefreshToken",  () => {
    it("should decode a token successfully", async () => {
      const input = "eyJpZCI6ImVlY2VkNzIwLTE2NDgtNDcxMS1iNzI2LTlkMjgxZTczNWM2OCIsImFjY291bnRfaWQiOiI1MmE3NDg4NS00MDk4LTQ2YzMtOWE0NS0xMGE3NmUyNTg4MDAiLCJjcmVhdGVkX2F0IjoiMjAyMC0wMS0wMVQwMDowMDowMC4wMDBaIn0=";
      const output = await decodeRefreshToken(input);
      expect(output).toEqual({
        id: "eeced720-1648-4711-b726-9d281e735c68",
        account_id: "52a74885-4098-46c3-9a45-10a76e258800",
        // Midnight 1st Jan 2020
        created_at: new Date(Date.UTC(2020, 0, 1)).toISOString(),
      });
    });
  });
})
