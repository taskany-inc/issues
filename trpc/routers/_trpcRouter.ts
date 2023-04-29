import { router } from '../trpcBackend';

import { filterRouter } from './filterRouter';

export const trpcRouter = router({
    filter: filterRouter,
});

export type TrpcRouter = typeof trpcRouter;
