import { db } from '../connection/kysely';
import { protectedProcedure, router } from '../trpcBackend';

export const priority = router({
    getAll: protectedProcedure.query(() => db.selectFrom('Priority').selectAll().orderBy('value desc').execute()),
});
