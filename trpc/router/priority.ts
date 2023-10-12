import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';

export const priority = router({
    getAll: protectedProcedure.query(() => prisma.priority.findMany({ orderBy: { value: 'desc' } })),
});
