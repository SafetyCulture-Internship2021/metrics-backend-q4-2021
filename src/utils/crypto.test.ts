/**
 * Crypto - Hash password tests
 *
 * @group unit
 * @group unit/utils/crypto
 */

import {hashPassword, verifyPassword} from "./crypto";

// this is 'password' in plaintext
const PRE_HASHED = "$2b$12$PE01lbaDW9b5TWynQQIc6Oa7OEHWYQO3CL4qY4oRqDY/5gTwFSHfy";
describe("crypto", () => {
  describe("hashPassword", () => {
    it("hashes a password as expected", async () => {
      const password = await hashPassword("password");
      expect(password).toBeDefined();
      // We generate a new salt for each password, so we can't do hard expectations
      expect(/^\$2[ayb]\$.{56}$/.test(password)).toBeTruthy();
    });
  });
  describe("verifyPassword", () => {
    it("returns true when a matching password and hash are supplied", async () => {
      const isValid = await verifyPassword("password", PRE_HASHED);
      expect(isValid).toBe(true);
    });
    it("returns false when an invalid password is supplied", async () => {
      const isValid = await verifyPassword("password1", PRE_HASHED);
      expect(isValid).toBe(false);
    });
  });
})
