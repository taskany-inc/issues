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
import { estimates } from './estimates';
import { feedback } from './feedback';
import { whatsnew } from './whatsnew';

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
    estimates,
    feedback,
    whatsnew,
});

export type TrpcRouter = typeof trpcRouter;
