import { ConnectionOptions } from 'pg-connection-string';

type RequiredOptions = {
    [K in keyof Pick<Required<ConnectionOptions>, 'database' | 'host' | 'password' | 'user'>]: Exclude<
        ConnectionOptions[K],
        undefined | null
    >;
};

interface AdditionalOptions {
    port: number;
    poolTimeout: number;
    connectionLimit: number;
    schema?: string;
}

export const parseConnectionURL = (): (RequiredOptions & AdditionalOptions) | void => {
    if (process.env.DATABASE_URL) {
        const connectObject = new URL(process.env.DATABASE_URL);
        const params = Array.from(connectObject.searchParams).reduce<{ [key: string]: string | number }>(
            (acc, [key, value]) => {
                let val: number | string = +value;

                if (Number.isNaN(val)) {
                    val = value;
                }

                acc[key] = val;

                return acc;
            },
            {},
        );

        return {
            database: connectObject.pathname.replace('/', ''),
            host: connectObject.hostname,
            user: connectObject.username,
            password: decodeURIComponent(connectObject.password),
            port: Number(connectObject.port),
            poolTimeout: 'pool_timeout' in params ? Number(params.pool_timeout) : 8,
            connectionLimit: 'connection_limit' in params ? Number(params.connection_limit) : 10,
            schema: 'schema' in params ? String(params.schema) : 'public',
        };
    }
};
