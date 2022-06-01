import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { UserSession, Tag, SortOrder } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('tagCompletion', {
        type: Tag,
        args: {
            sortBy: arg({ type: SortOrder }),
            query: nonNull(stringArg()),
        },
        // eslint-disable-next-line no-shadow
        resolve: async (_, { sortBy, query }, { db }) => {
            if (query === '') {
                return [];
            }

            return db.tag.findMany({
                orderBy: { createdAt: sortBy || undefined },
                where: {
                    title: {
                        contains: query,
                        mode: 'insensitive',
                    },
                },
                take: 5,
            });
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createTag', {
        type: Tag,
        args: {
            title: nonNull(stringArg()),
            description: stringArg(),
            user: nonNull(arg({ type: UserSession })),
        },
        resolve: async (_, { user, title, description }, { db }) => {
            const validUser = await db.user.findUnique({ where: { id: user.id }, include: { activity: true } });

            if (!validUser) return null;

            try {
                return db.tag.create({
                    data: {
                        title,
                        description,
                        activityId: validUser.activityId,
                    },
                });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
