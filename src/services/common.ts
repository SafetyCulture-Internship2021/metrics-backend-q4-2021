import type {Database, IDatabase, ITx, IQueryable} from "../db";

/**
 * A set of options to be provided with any service calls
 */
export type ServiceCallOpts = {
    /**
     * Optional transaction object
     */
    tx?: ITx;
}

/**
 * Ensure there is an active transaction from the options
 * @param database {Database} An initialised database reference
 * @param opts {ServiceCallOpts} a set of options that may contain a transaction
 * @return {IQueryable} pg connection
 */
export function ensureConn(database: IDatabase, opts?: ServiceCallOpts): IQueryable {
    return opts?.tx?.conn || database.pool;
}
