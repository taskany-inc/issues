import { router } from '../trpcBackend';

import { filterRouter } from './filter';
import { flowRouter } from './flow';
import { userRouter } from './user';
import { reactionRouter } from './reaction';
import { tagRouter } from './tag';
import { commentRouter } from './comment';

export const trpcRouter = router({
    filter: filterRouter,
    flow: flowRouter,
    user: userRouter,
    reaction: reactionRouter,
    tag: tagRouter,
    comment: commentRouter,
});

export type TrpcRouter = typeof trpcRouter;
