import { sql } from 'kysely';

import { Activity as ActivityDTO, User, Ghost } from '../../generated/kysely/types';
import { db } from '../connection/kysely';
import { ExtractTypeFromGenerated } from '../utils';

export interface Activity extends ExtractTypeFromGenerated<ActivityDTO> {
    user: ExtractTypeFromGenerated<User>;
    ghost: ExtractTypeFromGenerated<Ghost> | null;
}

export const getUserActivity = () => {
    return db
        .selectFrom('Activity')
        .innerJoin('User', 'User.activityId', 'Activity.id')
        .leftJoin('Ghost', 'Ghost.id', 'Activity.ghostId')
        .selectAll('Activity')
        .select([sql`"User"`.as('user'), sql`"Ghost"`.as('ghost')])
        .$castTo<Activity>();
};
