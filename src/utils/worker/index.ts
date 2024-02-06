import * as Sentry from '@sentry/nextjs';
import { worker, Job } from '@taskany/bricks';

import { defaultJobDelay } from './create';
import * as resolve from './resolve';
import { getNextJob, jobDelete, jobUpdate } from './jobOperations';

const queueInterval = process.env.WORKER_JOBS_INTERVAL ? parseInt(process.env.WORKER_JOBS_INTERVAL, 10) : 3000;
const retryLimit = process.env.WORKER_JOBS_RETRY ? parseInt(process.env.WORKER_JOBS_RETRY, 10) : 3;

// eslint-disable-next-line no-console
const log = (...rest: unknown[]) => console.log('[WORKER]:', ...rest);

log('Worker started successfully');

const onRetryLimitExeed = (error: any, job: Job) =>
    Sentry.captureException(error, {
        fingerprint: ['worker', 'resolve', 'retry'],
        extra: {
            job,
        },
    });

const onQueeTooLong = () => Sentry.captureMessage('Queue too long. Smth went wrong.');

const onError = (error: any) => console.log(error.message);

const init = () =>
    worker(
        getNextJob,
        jobUpdate,
        jobDelete,
        resolve,
        onRetryLimitExeed,
        onQueeTooLong,
        log,
        onError,
        defaultJobDelay,
        retryLimit,
    );

(() =>
    setInterval(async () => {
        await init();
    }, queueInterval))();
