import {IDatabase} from "../src/db";

export async function clearDB(db: IDatabase) {
  await db.pool.query(`
    DELETE FROM accounts;
    DELETE FROM account_tokens;
  `);
}
