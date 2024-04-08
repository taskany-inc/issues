import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { db } from '../connection/kysely';

interface FilterQueryParams {
    isDefault?: boolean;
    activityId?: string;
    id?: string;
}

export const filterQuery = ({ activityId = '', id = '', isDefault }: FilterQueryParams | void = {}) => {
    return db
        .selectFrom('Filter')
        .select((eb) => [
            'Filter.activityId',
            'Filter.createdAt',
            'Filter.description',
            'Filter.default',
            'Filter.id',
            'Filter.mode',
            'Filter.params',
            'Filter.title',
            'Filter.updatedAt',
            jsonArrayFrom(
                eb
                    .selectFrom('_filterStargizers')
                    .select(['_filterStargizers.A as id', '_filterStargizers.B as filterId'])
                    .whereRef('_filterStargizers.B', '=', 'Filter.id')
                    .$if(activityId.length > 0, (qb) => qb.where('_filterStargizers.A', '=', activityId)),
            ).as('stargizers'),
        ])
        .$if(activityId.length > 0, (qb) => qb.where('Filter.activityId', '=', activityId))
        .$if(!!isDefault, (qb) => qb.where('Filter.default', 'is', true))
        .$if(id.length > 0, (qb) => qb.where('Filter.id', '=', id));
};
