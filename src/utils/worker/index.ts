import { PrismaClient } from '@prisma/client';

import { JobDataMap, JobKind, jobKind, jobState } from './create';
import * as resolve from './resolve';

const prisma = new PrismaClient();
const queueInterval = process.env.WORKER_JOBS_INTERVAL ? parseInt(process.env.WORKER_JOBS_INTERVAL, 10) : 3000;
const retryLimit = process.env.WORKER_JOBS_RETRY ? parseInt(process.env.WORKER_JOBS_RETRY, 10) : 3;
const defaultJobDelay = process.env.WORKER_JOBS_DELAY ? parseInt(process.env.WORKER_JOBS_DELAY, 10) : 1000;

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

            jobs.forEach(async (job) => {
                if (job.state === jobState.completed) {
                    setTimeout(async () => {
                        await prisma.job.delete({ where: { id: job.id } });
                    }, 0);
                }

                if (job.state === jobState.scheduled) {
                    setTimeout(async () => {
                        await prisma.job.update({ where: { id: job.id }, data: { state: jobState.pending } });
                    }, 0);

                    setTimeout(async () => {
                        try {
                            await resolve[job.kind as jobKind](job.data as JobDataMap[JobKind]);
                            await prisma.job.update({ where: { id: job.id }, data: { state: jobState.completed } });
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } catch (error: any) {
                            if (job.retry !== retryLimit) {
                                const retry = job.retry ? job.retry + 1 : 1;
                                setTimeout(async () => {
                                    await prisma.job.update({
                                        where: { id: job.id },
                                        data: { state: jobState.scheduled, error: error?.message, retry },
                                    });
                                }, retry * defaultJobDelay);
                            }
                        }
                    }, job.delay || defaultJobDelay);
                }
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error(error.message);
        }
    }, queueInterval))();
