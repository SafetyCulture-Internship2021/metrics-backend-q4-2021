import type {Database, Tx} from "../db";
import {ClientBase} from "pg";

/**
 * A set of options to be provided with any service calls
 */
export type ServiceCallOpts = {
    /**
     * Optional transaction object
     */
    tx?: Tx;
}

/**
 * Ensure there is an active transaction from the options
 * @param database {Database} An initialised database reference
 * @param opts {ServiceCallOpts} a set of options that may contain a transaction
 * @return {ClientBase} pg connection
 */
export async function ensureConn(database: Database, opts?: ServiceCallOpts): Promise<ClientBase> {
    return opts?.tx?.conn || (await database.tx()).conn;
}
