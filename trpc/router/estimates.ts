import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';

export const estimates = router({
    all: protectedProcedure.query(async () => prisma.estimate.findMany()),
});
