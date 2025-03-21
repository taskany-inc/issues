import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import debug from 'debug';

import { DB as Database } from '../generated/kysely/types'; // this is the Database interface we defined earlier

import { parseConnectionURL } from './parseConnectionURL';

const connectionConfig = parseConnectionURL();

const dialect = new PostgresDialect({
    pool: new Pool({
        database: connectionConfig?.database,
        host: connectionConfig?.host,
        user: connectionConfig?.user,
        password: connectionConfig?.password,
        port: connectionConfig?.port,
        max: connectionConfig?.connectionLimit,
        options: `-c search_path=${connectionConfig?.schema || 'public'}`,
    }),
});

const dbProviderLog = debug('goals:kysely');

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
    dialect,
    plugins: [
        {
            transformQuery(query) {
                if (dbProviderLog.enabled) {
                    dbProviderLog(db.getExecutor().compileQuery(query.node, query.queryId));
                }
                return query.node;
            },
            async transformResult(res) {
                if (dbProviderLog.enabled) {
                    dbProviderLog(JSON.stringify(res.result));
                }

                return res.result;
            },
        },
    ],
});
