import config from "config";
import {Pool} from "pg";

/**
 * initPool will initialise a new postgres pool object with the application config
 * @return {Pool} the initialised pool
 */
export function initPool(): Pool {
    return new Pool({
        host: config.get('db.host') || 'localhost',
        port: config.get('db.port') || 5432,
        database: config.get('db.name') || '',
        user: config.get('db.user') || '',
        password: config.get('db.pass') || '',
        min: config.get('db.pool.min') || 0,
        max: config.get('db.pool.max') || 10
    });
}