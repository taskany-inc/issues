import { db } from './connection/kysely';

export type DBQuery = ReturnType<(typeof db)['selectFrom']>;

export const extendQuery = <T extends DBQuery>(qb: T, ...extenders: Array<(arg: T) => T>): T => {
    return extenders.reduce((fn, extender) => extender(fn), qb);
};
