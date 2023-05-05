import { router } from '../trpcBackend';

import { filterRouter } from './filter';
import { flowRouter } from './flow';

export const trpcRouter = router({
    filter: filterRouter,
    flow: flowRouter,
});

export type TrpcRouter = typeof trpcRouter;
