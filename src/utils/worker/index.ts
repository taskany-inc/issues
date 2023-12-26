import { PrismaClient } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import parser from 'cron-parser';

import { jobKind, jobState } from './create';
import * as resolve from './resolve';

const prisma = new PrismaClient();
const queueInterval = process.env.WORKER_JOBS_INTERVAL ? parseInt(process.env.WORKER_JOBS_INTERVAL, 10) : 3000;
const retryLimit = process.env.WORKER_JOBS_RETRY ? parseInt(process.env.WORKER_JOBS_RETRY, 10) : 3;

// eslint-disable-next-line no-console
console.log('Worker started successfully');

(() =>
    setInterval(async () => {
        try {
            const jobs = await prisma.job.findMany({
                orderBy: {
                    priority: 'desc',
                },
            });

            if (jobs.length > 300) {
                Sentry.captureMessage('Queue too long. Smth went wrong.');
            }

            jobs.forEach(async (job) => {
                if (job.state === jobState.completed) {
                    setTimeout(async () => {
                        if (job.cron) {
                            await prisma.job.update({
                                where: { id: job.id },
                                data: {
                                    state: jobState.scheduled,
                                },
                            });
                        } else {
                            await prisma.job.delete({ where: { id: job.id } });
                        }
                    }, 0);
                }

                if (job.state === jobState.scheduled) {
                    if (job.cron) {
                        const interval = parser.parseExpression(job.cron, {
                            currentDate: new Date(job.updatedAt),
                        });

                        if (Number(interval.next().toDate()) > Date.now() && !job.force) {
                            return;
                        }
                    }

                    if (job.delay && Date.now() - new Date(job.createdAt).valueOf() < job.delay) {
                        return;
                    }

                    setTimeout(async () => {
                        await prisma.job.update({ where: { id: job.id }, data: { state: jobState.pending } });
                    }, 0);

                    setTimeout(async () => {
                        try {
                            await resolve[job.kind as jobKind](job.data as any);
                            await prisma.job.update({
                                where: { id: job.id },
                                data: { state: jobState.completed, runs: { increment: 1 }, force: false },
                            });
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } catch (error: any) {
                            if (job.retry !== retryLimit) {
                                const retry = job.retry ? job.retry + 1 : 1;
                                setTimeout(async () => {
                                    await prisma.job.update({
                                        where: { id: job.id },
                                        data: { state: jobState.scheduled, error: error?.message, retry },
                                    });
                                }, 0);
                            } else {
                                Sentry.captureException(error, {
                                    fingerprint: ['worker', 'resolve', 'retry'],
                                    extra: {
                                        job,
                                    },
                                });

                                await prisma.job.delete({ where: { id: job.id } });
                            }
                        }
                    }, 0);
                }
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error(error.message);
        }
    }, queueInterval))();
