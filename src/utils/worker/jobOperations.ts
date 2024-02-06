import { PrismaClient, Prisma, Job as PrismaJob } from '@prisma/client';
import { Job } from '@taskany/bricks';

import { jobState } from './create';

const prisma = new PrismaClient();
export const removeNullsFromJob = (jobWithNulls: PrismaJob): Job => {
    return {
        ...jobWithNulls,
        cron: jobWithNulls.cron!,
        delay: jobWithNulls.delay!,
        retry: jobWithNulls.retry!,
        error: jobWithNulls.error!,
    };
};
export const getNextJob = async (state: jobState, exclude: string[]): Promise<Job> => {
    // get first job with state
    // update Status to pending
    // lock before updating

    const [job] = (await prisma.$queryRaw(Prisma.sql`
        WITH cte AS (
            SELECT *
            FROM "Job"
            WHERE "state" = ${state} ${
        exclude.length ? Prisma.sql`AND "id" NOT IN (${Prisma.join(exclude)})` : Prisma.empty
    }
            ORDER BY "priority" DESC
            LIMIT 1
            FOR UPDATE
            SKIP LOCKED
        )
        UPDATE "Job" job
        SET "state" = ${jobState.pending}
        FROM cte
        WHERE job.id = cte.id
        RETURNING *
    `)) as PrismaJob[];
    return removeNullsFromJob(job);
};

export const jobUpdate = async (id: string, data: Prisma.JobUpdateInput): Promise<void> => {
    await prisma.job.update({
        where: { id },
        data,
    });
};

export const jobDelete = async (id: string): Promise<void> => {
    await prisma.job.delete({ where: { id } });
};
