import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';

export const state = router({
    all: protectedProcedure.query(async () => prisma.state.findMany()),
});
