import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { SortOrder, Flow } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('flowCompletion', {
        type: Flow,
        args: {
            sortBy: arg({ type: SortOrder }),
            query: nonNull(stringArg()),
        },
        // eslint-disable-next-line no-shadow
        resolve: async (_, { sortBy, query }, { db }) => {
            if (query === '') {
                return [];
            }

            return db.flow.findMany({
                orderBy: { createdAt: sortBy || undefined },
                where: {
                    OR: [
                        {
                            title: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            states: {
                                some: {
                                    title: {
                                        contains: query,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                    ],
                },
                include: {
                    states: true,
                },
            });
        },
    });

    t.list.field('flowRecommended', {
        type: Flow,
        // eslint-disable-next-line no-empty-pattern
        resolve: async (_, {}, { db }) => {
            return db.flow.findMany({
                where: {
                    recommended: true,
                },
                include: {
                    states: true,
                },
            });
        },
    });

    t.field('flow', {
        type: Flow,
        args: {
            id: nonNull(stringArg()),
        },
        resolve: async (_, { id }, { db }) => {
            return db.flow.findUnique({
                where: {
                    id,
                },
                include: {
                    states: true,
                },
            });
        },
    });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {};
