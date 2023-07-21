import { prisma } from '../prisma';

import * as templates from './mail/templates';

export enum jobState {
    scheduled = 'scheduled',
    pending = 'pending',
    completed = 'completed',
}

export enum jobKind {
    email = 'email',
}

type Templates = typeof templates;

export interface JobDataMap {
    email: {
        template: keyof Templates;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
    };
}

export type JobKind = keyof JobDataMap;

interface CreateJobProps<K extends keyof JobDataMap> {
    data: JobDataMap[K];
    priority?: number;
    delay?: number;
    cron?: string;
}

export function createJob<K extends keyof JobDataMap>(kind: K, { data, priority, delay, cron }: CreateJobProps<K>) {
    return prisma.job.create({
        data: {
            state: jobState.scheduled,
            data,
            kind,
            priority,
            delay,
            cron,
        },
    });
}

export function createEmailJob<T extends keyof typeof templates>(template: T, data: Parameters<Templates[T]>[number]) {
    return createJob('email', {
        data: {
            template,
            data,
        },
    });
}
