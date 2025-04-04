import { PrismaClient, Job, Prisma } from '@prisma/client';
import parser from 'cron-parser';

import Sentry from './sentry';
import { jobKind, jobState, defaultJobDelay } from './create';
import * as resolve from './resolve';
import { log } from './utils';

const prisma = new PrismaClient();
const queueInterval = process.env.WORKER_JOBS_INTERVAL ? parseInt(process.env.WORKER_JOBS_INTERVAL, 10) : 3000;
const retryLimit = process.env.WORKER_JOBS_RETRY ? parseInt(process.env.WORKER_JOBS_RETRY, 10) : 3;

log('Worker started successfully');

const getNextJob = async (state: jobState, exclude: string[]) => {
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
    `)) as Job[];

    return job || null;
};

const iterateJobQueue = async (state: jobState, cb: (job: Job) => Promise<void>): Promise<number> => {
    const watchedIds: string[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
        // eslint-disable-next-line no-await-in-loop
        const job = await getNextJob(state, watchedIds);

        if (!job) {
            break;
        }

        watchedIds.push(job.id);
        // eslint-disable-next-line no-await-in-loop
        await cb(job);
    }

    return watchedIds.length;
};

const worker = async () => {
    try {
        const completedCount = await iterateJobQueue(jobState.completed, async (job) => {
            log(`completed: ${job.id} - ${job.kind}`);
            setTimeout(async () => {
                if (job.cron) {
                    log(`plan cron ${job.id}`);
                    await prisma.job.update({
                        where: { id: job.id },
                        data: {
                            state: jobState.scheduled,
                        },
                    });
                } else {
                    log(`delete job ${job.id}`);
                    await prisma.job.delete({ where: { id: job.id } });
                }
            }, 0);
        });

        const scheduledCount = await iterateJobQueue(jobState.scheduled, async (job) => {
            const planJob = () =>
                prisma.job.update({
                    where: { id: job.id },
                    data: {
                        state: jobState.scheduled,
                    },
                });

            if (job.cron) {
                const interval = parser.parseExpression(job.cron, {
                    currentDate: new Date(job.updatedAt),
                });

                const nextCronIntervalInMinutes = Math.floor(Number(interval.next().toDate()) / 1000 / 60);
                const nowToMinutes = Math.floor(Date.now() / 1000 / 60);

                if (nextCronIntervalInMinutes > nowToMinutes && !job.force) {
                    await planJob();

                    return;
                }
            }

            if (
                job.delay &&
                (Date.now() - new Date(job.createdAt).valueOf() < job.delay ||
                    Date.now() - new Date(job.updatedAt).valueOf() < job.delay)
            ) {
                await planJob();

                return;
            }

            setTimeout(async () => {
                try {
                    log(`resolve job ${job.kind} ${job.id}`);

                    await resolve[job.kind as jobKind](job.data as any);
                    await prisma.job.update({
                        where: { id: job.id },
                        data: { state: jobState.completed, runs: { increment: 1 }, force: false },
                    });
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (error: any) {
                    if (job.retry !== retryLimit) {
                        const retry = job.retry ? job.retry + 1 : 1;

                        log(`error job ${job.id}`, error);
                        log(`retry job ${job.id}`);

                        setTimeout(async () => {
                            await prisma.job.update({
                                where: { id: job.id },
                                data: {
                                    state: jobState.scheduled,
                                    error: error?.message,
                                    retry,
                                    delay: defaultJobDelay * retry,
                                },
                            });
                        }, 0);
                    } else {
                        Sentry.captureException(error, {
                            fingerprint: ['worker', 'resolve', 'retry'],
                            extra: {
                                job,
                            },
                        });

                        log(`delete job ${job.id} after ${retryLimit} retries`);

                        await prisma.job.delete({ where: { id: job.id } });
                    }
                }
            }, 0);
        });

        if (completedCount + scheduledCount > 300) {
            Sentry.captureMessage('Queue too long. Smth went wrong.');
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error(error.message);

        return Sentry.captureException(error, {
            fingerprint: ['worker', 'resolve', 'error'],
        });
    }
};

(() =>
    setInterval(async () => {
        await worker();
    }, queueInterval))();
