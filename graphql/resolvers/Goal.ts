import { arg, nonNull, stringArg, intArg, booleanArg, list } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Goal, UserSession, GoalEstimate, computeUserFields, withComputedField } from '../types';
// import { mailServer } from '../src/utils/mailServer';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('goalUserIndex', {
        type: Goal,
        args: {
            user: nonNull(UserSession),
        },
        resolve: async (_, { user }, { db }) => {
            const validUser = await db.user.findUnique({ where: { id: user.id } });

            if (!validUser || !validUser.activityId) return null;

            const goals = await db.goal.findMany({
                where: {
                    OR: [
                        {
                            issuerId: validUser.activityId,
                        },
                        {
                            ownerId: validUser.activityId,
                        },
                        {
                            participants: {
                                some: {
                                    id: validUser.activityId,
                                },
                            },
                        },
                    ],
                },
                include: {
                    owner: {
                        ...computeUserFields,
                    },
                    issuer: {
                        ...computeUserFields,
                    },
                    tags: true,
                    state: true,
                    project: true,
                },
            });

            return goals.map(withComputedField('owner', 'issuer'));
        },
    });

    t.field('goal', {
        type: Goal,
        args: {
            id: nonNull(stringArg()),
        },
        resolve: async (_, { id }, { db }) => {
            const goal = await db.goal.findUnique({
                where: {
                    id,
                },
                include: {
                    owner: {
                        ...computeUserFields,
                    },
                    issuer: {
                        ...computeUserFields,
                    },
                    tags: true,
                    state: true,
                    project: true,
                },
            });

            return withComputedField('owner', 'issuer')(goal);
        },
    });
};

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
            tags: list(nonNull(stringArg())),
        },
        resolve: async (
            _,
            {
                user,
                title,
                description,
                ownerId,
                projectId,
                key,
                private: isPrivate,
                personal,
                estimate,
                stateId,
                tags,
            },
            { db },
        ) => {
            const validUser = await db.user.findUnique({ where: { id: user.id }, include: { activity: true } });

            if (!validUser) return null;

            const [goalOwner, project, goalsCount] = await Promise.all([
                db.user.findUnique({ where: { id: ownerId }, include: { activity: true } }),
                db.project.findUnique({ where: { id: projectId } }),
                db.goal.count(),
            ]);

            const newGoalId = `${project?.key}-${goalsCount + 1}`;

            try {
                const newGoal = db.goal.create({
                    data: {
                        id: newGoalId,
                        title,
                        description,
                        projectId,
                        key: Boolean(key),
                        private: Boolean(isPrivate),
                        personal: Boolean(personal),
                        stateId,
                        ownerId: goalOwner?.activity?.id,
                        issuerId: validUser.activity?.id,
                        tags: {
                            connect: tags?.map((id) => ({ id })),
                        },
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
