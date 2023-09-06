import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';

export const estimates = router({
    ranges: protectedProcedure.query(async () =>
        prisma.estimate.groupBy({
            by: ['q', 'y'],
            orderBy: {
                y: 'desc',
            },
        }),
    ),
});
