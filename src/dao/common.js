/**
 * Ensure there is an active transaction from the options
 * @param database {Database} An initialised database reference
 * @param opts {Object?} a set of options that may contain a transaction
 * @return {Object} pg connection
 */
export function ensureConn(database, opts) {
    return opts?.tx?.conn || database.pool;
}
