import { jsonArrayFrom } from 'kysely/helpers/postgres';

import { db } from '../../src/utils/db/connection/kysely';

interface FlowQueryParams {
    id?: string;
    title?: string;
}

export const flowQuery = ({ id, title = '' }: FlowQueryParams | void = {}) => {
    return db
        .selectFrom('Flow')
        .selectAll('Flow')
        .select((eb) => [
            jsonArrayFrom(
                eb
                    .selectFrom('State')
                    .selectAll()
                    .$if(title?.length > 0, (queryBuilder) => queryBuilder.where('State.title', 'ilike', title)),
            ).as('states'),
        ])
        .$if(title.length > 0, (queryBuilder) => queryBuilder.where('Flow.title', 'ilike', title))
        .$if(id != null, (qb) => qb.where('Flow.id', '=', id as string));
};
