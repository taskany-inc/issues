import { sql } from 'kysely';

import { db } from '../connection/kysely';

interface FilterQueryParams {
    isDefault?: boolean;
    activityId?: string;
    id?: string;
}

export const filterQuery = ({ activityId = '', id = '', isDefault }: FilterQueryParams | void = {}) => {
    return db
        .selectFrom('Filter')
        .selectAll('Filter')
        .select(({ exists, selectFrom, val }) => [
            exists(
                selectFrom('_filterStargizers')
                    .select(['_filterStargizers.A as id', '_filterStargizers.B as filterId'])
                    .whereRef('_filterStargizers.B', '=', 'Filter.id')
                    .$if(activityId.length > 0, (qb) => qb.where('_filterStargizers.A', '=', activityId)),
            ).as('_isStarred'),
            sql<boolean>`("Filter"."activityId" = ${val(activityId)})`.as('_isOwner'),
        ])
        .$if(activityId.length > 0 && !isDefault, (qb) => qb.where('Filter.activityId', '=', activityId))
        .$if(!!isDefault, (qb) => qb.where('Filter.default', 'is', true))
        .$if(id.length > 0, (qb) => qb.where('Filter.id', '=', id));
};
