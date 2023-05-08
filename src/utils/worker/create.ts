import { EmailTemplatesPropsMap } from '../mail/templates';
import { prisma } from '../prisma';

export enum jobState {
    scheduled = 'scheduled',
    pending = 'pending',
    completed = 'completed',
}

export enum jobKind {
    email = 'email',
}

export interface JobDataMap {
    email: {
        template: keyof EmailTemplatesPropsMap;
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

export function createEmailJob<T extends keyof EmailTemplatesPropsMap>(template: T, data: EmailTemplatesPropsMap[T]) {
    return createJob('email', {
        data: {
            template,
            data,
        },
    });
}
