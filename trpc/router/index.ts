import { router } from '../trpcBackend';

import { filterRouter } from './filter';
import { flowRouter } from './flow';
import { userRouter } from './user';
import { reactionRouter } from './reaction';
import { tagRouter } from './tag';

export const trpcRouter = router({
    filter: filterRouter,
    flow: flowRouter,
    user: userRouter,
    reaction: reactionRouter,
    tag: tagRouter,
});

export type TrpcRouter = typeof trpcRouter;
