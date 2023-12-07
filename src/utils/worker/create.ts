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

type Mapper<T extends keyof Templates = keyof Templates> = <Params extends Parameters<Templates[T]>[number]>(
    params: Params,
) => Params;

const excludeCurrentUser: Mapper = (params) => ({
    ...params,
    to: params.to.filter((email) => email !== params.authorEmail),
});

const excludeDuplicateUsers: Mapper = (params) => ({
    ...params,
    to: Array.from(new Set(params.to)),
});

const mappers = [excludeDuplicateUsers, excludeCurrentUser];

export function createEmailJob<T extends keyof Templates, Params extends Parameters<Templates[T]>[number]>(
    template: T,
    data: Params,
) {
    const mappedParams = mappers.reduce<Params>((acc, mapper) => mapper(acc), data);

    if (!mappedParams.to.length) {
        return null;
    }

    return createJob('email', {
        data: {
            template,
            data: mappedParams,
        },
    });
}
