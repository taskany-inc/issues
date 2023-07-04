import { router } from '../trpcBackend';

import { filter } from './filter';
import { flow } from './flow';
import { user } from './user';
import { reaction } from './reaction';
import { tag } from './tag';
import { project } from './project';
import { goal } from './goal';
import { search } from './search';
import { state } from './state';

export const trpcRouter = router({
    filter,
    flow,
    user,
    reaction,
    tag,
    project,
    goal,
    search,
    state,
});

export type TrpcRouter = typeof trpcRouter;
