import { router } from '../trpcBackend';

import { filterRouter } from './filter';
import { flowRouter } from './flow';
import { userRouter } from './user';

export const trpcRouter = router({
    filter: filterRouter,
    flow: flowRouter,
    user: userRouter,
});

export type TrpcRouter = typeof trpcRouter;
