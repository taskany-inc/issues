import { arg, nonNull, stringArg, intArg, booleanArg, list } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Goal, GoalInput, EstimateInput, computeUserFields, withComputedField } from '../types';
// import { mailServer } from '../src/utils/mailServer';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('goalUserIndex', {
        type: Goal,
        args: {
            pageSize: nonNull(intArg()),
            offset: nonNull(intArg()),
        },
        resolve: async (_, { offset, pageSize }, { db, activity }) => {
            if (!activity) return null;

            const goals = await db.goal.findMany({
                take: pageSize,
                skip: offset,
                where: {
                    OR: [
                        {
                            activityId: activity.id,
                        },
                        {
                            ownerId: activity.id,
                        },
                        {
                            participants: {
                                some: {
                                    id: activity.id,
                                },
                            },
                        },
                    ],
                },
                include: {
                    owner: {
                        ...computeUserFields,
                    },
                    activity: {
                        ...computeUserFields,
                    },
                    tags: true,
                    state: true,
                    project: true,
                    estimate: true,
                    dependsOn: {
                        include: {
                            state: true,
                        },
                    },
                    relatedTo: {
                        include: {
                            state: true,
                        },
                    },
                    blocks: {
                        include: {
                            state: true,
                        },
                    },
                },
            });

            return goals.map(withComputedField('owner', 'activity'));
        },
    });

    t.field('goal', {
        type: Goal,
        args: {
            id: nonNull(stringArg()),
        },
        resolve: async (_, { id }, { db, activity }) => {
            if (!activity) return null;

            const goal = await db.goal.findUnique({
                where: {
                    id,
                },
                include: {
                    owner: {
                        ...computeUserFields,
                    },
                    activity: {
                        ...computeUserFields,
                    },
                    tags: true,
                    state: true,
                    project: {
                        include: {
                            flow: true,
                        },
                    },
                    reactions: {
                        include: {
                            activity: {
                                ...computeUserFields,
                            },
                        },
                    },
                    estimate: true,
                    watchers: true,
                    stargizers: true,
                    dependsOn: {
                        include: {
                            state: true,
                        },
                    },
                    relatedTo: {
                        include: {
                            state: true,
                        },
                    },
                    blocks: {
                        include: {
                            state: true,
                        },
                    },
                },
            });

            return withComputedField('owner', 'activity')(goal);
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
            estimate: arg({ type: EstimateInput }),
            tags: list(nonNull(stringArg())),
        },
        resolve: async (
            _,
            { title, description, ownerId, projectId, key, private: isPrivate, personal, estimate, stateId, tags },
            { db, activity },
        ) => {
            if (!activity) return null;

            const [goalOwner, project, goalsCount] = await Promise.all([
                db.user.findUnique({ where: { id: ownerId }, include: { activity: true } }),
                db.project.findUnique({ where: { id: projectId } }),
                db.goal.count(),
            ]);

            try {
                return db.goal.create({
                    data: {
                        id: `${project?.key}-${goalsCount + 1}`,
                        title,
                        description,
                        projectId,
                        key: Boolean(key),
                        private: Boolean(isPrivate),
                        personal: Boolean(personal),
                        stateId,
                        ownerId: goalOwner?.activity?.id,
                        activityId: activity.id,
                        tags: {
                            connect: tags?.map((id) => ({ id })),
                        },
                        estimate: estimate
                            ? {
                                  create: {
                                      ...estimate,
                                      activityId: activity.id,
                                  },
                              }
                            : undefined,
                        watchers: {
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            connect: [activity, goalOwner?.activity].map((a) => ({ id: a!.id })),
                        },
                    },
                });

                // await mailServer.sendMail({
                //     from: '"Fred Foo 👻" <foo@example.com>',
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post <b>${title}</b>`,
                // });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });

    t.field('updateGoal', {
        type: Goal,
        args: {
            goal: nonNull(arg({ type: GoalInput })),
        },
        resolve: async (_, { goal: { watch, star, ...goal } }, { db, activity }) => {
            if (!activity) return null;

            const connection = { id: activity.id };
            const connectionMap: Record<string, string> = {
                true: 'connect',
                false: 'disconnect',
            };

            try {
                return db.goal.update({
                    where: { id: goal.id },
                    // @ts-ignore incompatible types of Goal and GoalInput
                    data: {
                        ...goal,
                        estimate: goal.estimate
                            ? {
                                  create: {
                                      ...goal.estimate,
                                      activityId: activity.id,
                                  },
                              }
                            : undefined,
                        watchers: watch !== undefined ? { [connectionMap[String(watch)]]: connection } : undefined,
                        stargizers: star !== undefined ? { [connectionMap[String(star)]]: connection } : undefined,
                    },
                });

                // await mailServer.sendMail({
                //     from: '"Fred Foo 👻" <foo@example.com>',
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post <b>${title}</b>`,
                // });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
