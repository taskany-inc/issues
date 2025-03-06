import { db } from '../../src/utils/db/connection/kysely';

interface TagQueryParams {
    excludedIds?: string[];
    title?: string;
    limit?: number;
    id?: string[];
}

export const tagQuery = ({ title = '', excludedIds = [], limit = 5, id = [] }: TagQueryParams | void = {}) => {
    return db
        .selectFrom('Tag')
        .selectAll()
        .$if(title?.length > 0, (qb) => qb.where('Tag.title', '~*', title))
        .$if(excludedIds.length > 0, (qb) => qb.where('Tag.id', 'not in', excludedIds))
        .$if(id.length > 0, (qb) => qb.where('Tag.id', 'in', id ?? []))
        .limit(limit);
};
