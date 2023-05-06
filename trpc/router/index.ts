import { router } from '../trpcBackend';

import { filter } from './filter';
import { flow } from './flow';
import { user } from './user';
import { reaction } from './reaction';
import { tag } from './tag';
import { comment } from './comment';
import { project } from './project';

export const trpcRouter = router({
    filter,
    flow,
    user,
    reaction,
    tag,
    comment,
    project,
});

export type TrpcRouter = typeof trpcRouter;
