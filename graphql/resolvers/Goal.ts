import { arg, nonNull, stringArg, intArg, booleanArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Goal, UserSession, GoalEstimate } from '../types';
// import { mailServer } from '../src/utils/mailServer';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createGoal', {
        type: Goal,
        args: {
            title: nonNull(stringArg()),
            description: nonNull(stringArg()),
            projectId: nonNull(intArg()),
            key: booleanArg(),
            private: booleanArg(),
            personal: booleanArg(),
            ownerId: nonNull(stringArg()),
            stateId: stringArg(),
            user: nonNull(arg({ type: UserSession })),
            estimate: arg({ type: GoalEstimate }),
        },
        resolve: async (
            _,
            { user, title, description, ownerId, projectId, key, private: isPrivate, personal, estimate, stateId },
            { db },
        ) => {
            const validUser = await db.user.findUnique({ where: { id: user.id }, include: { activity: true } });
            const goalOwner = await db.user.findUnique({ where: { id: ownerId }, include: { activity: true } });

            if (!validUser) return null;

            try {
                const newGoal = db.goal.create({
                    data: {
                        title,
                        description,
                        projectId,
                        key: Boolean(key),
                        private: Boolean(isPrivate),
                        personal: Boolean(personal),
                        stateId,
                        ownerId: goalOwner?.activity?.id,
                        issuerId: validUser.activity?.id,
                        estimate: estimate
                            ? {
                                  create: estimate,
                              }
                            : undefined,
                    },
                });

                // await mailServer.sendMail({
                //     from: '"Fred Foo 👻" <foo@example.com>',
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post <b>${title}</b>`,
                // });

                return newGoal;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
