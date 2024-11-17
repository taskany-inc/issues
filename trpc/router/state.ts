import { db } from '../connection/kysely';
import { protectedProcedure, router } from '../trpcBackend';

export const state = router({
    all: protectedProcedure.query(async () => db.selectFrom('State').selectAll().orderBy('State.order asc').execute()),
});
