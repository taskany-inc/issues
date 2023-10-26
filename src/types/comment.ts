import { Activity, Comment, State, User } from '@prisma/client';

import { ReactionsMap } from './reactions';

export interface GoalComment extends Comment {
    reactions: ReactionsMap;
    state?: State | null;
    activity?: (Activity | null) & { user: User | null };
}
