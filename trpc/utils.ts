import { ColumnType } from 'kysely';

import { Timestamp } from '../generated/kysely/types';

import { db } from './connection/kysely';

export type DBQuery = ReturnType<(typeof db)['selectFrom']>;

export const extendQuery = <T extends DBQuery>(qb: T, ...extenders: Array<(arg: T) => T>): T => {
    return extenders.reduce((fn, extender) => extender(fn), qb);
};

export const pickUniqueValues = <T, K extends keyof T>(values: T[] | null | void, byKey: K): T[] | null => {
    if (values == null || values.length < 1) {
        return null;
    }

    const uniqueMap = new Map<T[K], T>();

    for (const value of values) {
        const it = uniqueMap.get(value[byKey]);

        if (it == null) {
            uniqueMap.set(value[byKey], value);
        }
    }

    return Array.from(uniqueMap.values());
};

export type ExtractTypeFromGenerated<T> = {
    [K in keyof T]: T[K] extends ColumnType<infer Date, any, any>
        ? Date
        : T[K] extends Timestamp | null
        ? Date | null
        : T[K];
};
