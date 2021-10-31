import bcrypt from "bcrypt";

/**
 * Log2 salt factor @ 12 rounds this takes ~600ms to hash or verify
 */
const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password into a bcrypt hash string
 * @param password {string} the plaintext password
 * @return {string} the generated password hash
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a known valid hash
 * @param password {string} the plaintext password to verify
 * @param hash {string} the known valid hash to verify against
 * @return {boolean} whether or not the plaintext password provided was valid
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
