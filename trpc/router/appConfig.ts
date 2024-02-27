import { protectedProcedure, router } from '../trpcBackend';
import { fetchConfig } from '../../src/utils/db';

export const appConfig = router({
    get: protectedProcedure.query(async () => fetchConfig()),
});
