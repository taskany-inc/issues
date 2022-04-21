import { arg, nonNull, stringArg, intArg, booleanArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Goal, UserSession, GoalEstimate, Tag } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createTag', {
        type: Tag,
        args: {
            title: nonNull(stringArg()),
            description: stringArg(),
            color: nonNull(stringArg()),
            activityId: nonNull(stringArg()),
            user: nonNull(arg({ type: UserSession })),
        },
        resolve: async (_, { user, title, description, activityId, color }, { db }) => {
            const validUser = await db.user.findUnique({ where: { id: user.id }, include: { activity: true } });

            if (!validUser) return null;

            try {
                return db.tag.create({
                    data: {
                        title,
                        description,
                        color,
                        activityId,
                    },
                });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
