import { router } from '../trpcBackend';

import { priority } from './priority';
import { filter } from './filter';
import { flow } from './flow';
import { user } from './user';
import { reaction } from './reaction';
import { tag } from './tag';
import { project } from './project';
import { goal } from './goal';
import { search } from './search';
import { state } from './state';
import { feedback } from './feedback';
import { whatsnew } from './whatsnew';
import { crew } from './crew';

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
    feedback,
    whatsnew,
    priority,
    crew,
});

export type TrpcRouter = typeof trpcRouter;
