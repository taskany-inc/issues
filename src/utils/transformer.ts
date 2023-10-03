import { CombinedDataTransformer } from '@trpc/server';

const datePrefix = '_serializedDate_';
const undefinedPlaceholder = '_undefined_';

export const serialize = (data: any): any => {
    if (typeof data === 'function') throw new Error('Cannot serialize function');
    if (typeof data === 'symbol') throw new Error('Cannot serialize symbol');
    if (typeof data === 'bigint') throw new Error('Cannot serialize bigint');
    if (typeof data === 'undefined') return undefinedPlaceholder;
    if (typeof data === 'object') {
        if (data === null) return data;
        if (data instanceof Date) return `${datePrefix}${data.toISOString()}`;
        if (Array.isArray(data)) return data.map(serialize);
        return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, serialize(v)]));
    }
    return data;
};

export const deserialize = (data: any): any => {
    if (typeof data === 'string') {
        if (data.startsWith(datePrefix)) return new Date(data.slice(datePrefix.length));
        if (data === undefinedPlaceholder) return undefined;
    }
    if (typeof data === 'object') {
        if (data === null) return data;
        if (Array.isArray(data)) return data.map(deserialize);
        return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, deserialize(v)]));
    }
    return data;
};

export const transformer: CombinedDataTransformer = {
    input: { serialize, deserialize },
    output: { serialize, deserialize },
};
