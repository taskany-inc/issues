import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { connectionMap } from '../queries/connections';
import { addCalclulatedGoalsFields, calcGoalsMeta, goalDeepQuery, goalsFilter } from '../queries/goals';
import {
    Goal,
    GoalUpdateInput,
    GoalCreateInput,
    SubscriptionToggleInput,
    Activity,
    GoalDependencyToggleInput,
    dependencyKind,
    UserGoalsInput,
    GoalArchiveInput,
    UserGoalsOutput,
} from '../types';
// import { mailServer } from '../src/utils/mailServer';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.field('userGoals', {
        type: UserGoalsOutput,
        args: {
            data: nonNull(arg({ type: UserGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            const userDashboardGoals = {
                AND: {
                    OR: [
                        // all projects where the user is a participant
                        {
                            project: {
                                participants: {
                                    some: {
                                        id: activity.id,
                                    },
                                },
                            },
                        },
                        // all projects where the user is a watcher
                        {
                            project: {
                                watchers: {
                                    some: {
                                        id: activity.id,
                                    },
                                },
                            },
                        },
                        // all projects where the user is owner
                        {
                            project: {
                                activityId: activity.id,
                            },
                        },
                        // all goals where the user is a participant
                        {
                            participants: {
                                some: {
                                    id: activity.id,
                                },
                            },
                        },
                        // all goals where the user is a watcher
                        {
                            watchers: {
                                some: {
                                    id: activity.id,
                                },
                            },
                        },
                        // all goals where the user is issuer
                        {
                            activityId: activity.id,
                        },
                        // all goals where the user is owner
                        {
                            ownerId: activity.id,
                        },
                    ],
                },
            };

            const [allUserGoals, filtredUserGoals] = await Promise.all([
                db.goal.findMany({
                    ...goalsFilter(
                        {
                            priority: [],
                            states: [],
                            tags: [],
                            estimates: [],
                            owner: [],
                            projects: [],
                            query: '',
                        },
                        {
                            ...userDashboardGoals,
                        },
                    ),
                    include: {
                        ...goalDeepQuery,
                    },
                }),
                db.goal.findMany({
                    ...goalsFilter(data, {
                        ...userDashboardGoals,
                    }),
                    include: {
                        ...goalDeepQuery,
                    },
                }),
            ]);

            return {
                goals: filtredUserGoals,
                // TODO: try to solve types collision
                meta: calcGoalsMeta(allUserGoals as any),
            };
        },
    });

    t.field('goal', {
        type: Goal,
        args: {
            id: nonNull(stringArg()),
        },
        resolve: async (_, { id }, { db, activity }) => {
            if (!activity) return null;

            const goal = await db.goal.findFirst({
                where: {
                    id,
                    archived: false,
                },
                include: {
                    ...goalDeepQuery,
                },
            });

            if (!goal) return null;

            return {
                ...goal,
                ...(addCalclulatedGoalsFields(goal as any, activity.id) as any),
            };
        },
    });

    // FIXME: do it in other way
    t.list.string('goalDependencyKind', {
        resolve: async (_, _args, { activity }) => {
            if (!activity) return null;

            return dependencyKind;
        },
    });

    t.list.field('findGoal', {
        type: Goal,
        args: {
            query: nonNull(stringArg()),
        },
        resolve: async (_, { query }, { db, activity }) => {
            if (!activity) return null;

            if (query === '') {
                return [];
            }

            return db.goal.findMany({
                where: {
                    OR: [
                        {
                            id: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            title: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                    AND: {
                        OR: [
                            {
                                archived: false,
                            },
                            {
                                archived: null,
                            },
                        ],
                    },
                },
                take: 5,
                include: {
                    owner: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                    activity: {
                        include: {
                            user: true,
                            ghost: true,
                        },
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
                                include: {
                                    user: true,
                                    ghost: true,
                                },
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
                    comments: {
                        include: {
                            activity: {
                                include: {
                                    user: true,
                                    ghost: true,
                                },
                            },
                            reactions: true,
                        },
                    },
                    participants: {
                        include: {
                            user: true,
                            ghost: true,
                        },
                    },
                },
            });
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createGoal', {
        type: Goal,
        args: {
            data: nonNull(arg({ type: GoalCreateInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;
            if (!data.projectId) return null;
            if (!data.ownerId) return null;

            const promises = [
                db.activity.findUnique({ where: { id: data.ownerId } }),
                db.project.findUnique({ where: { id: data.projectId } }),
            ];

            const [owner, parent] = await Promise.all(promises);

            if (!owner?.id) return null;
            if (!parent?.id) return null;

            const pre = `${parent?.id}-`;

            // FIXME: https://github.com/taskany-inc/issues/issues/627
            const lastGoal = await db.goal.findFirst({
                where: { id: { contains: pre } },
                orderBy: { createdAt: 'desc' },
            });
            const numId = lastGoal ? Number(lastGoal?.id?.replace(pre, '')) + 1 : 1;
            const id = `${pre}${numId}`;

            try {
                return db.goal.create({
                    data: {
                        ...data,
                        id,
                        activityId: activity.id,
                        ownerId: owner?.id,
                        tags: data.tags?.length
                            ? {
                                  connect: data.tags.map((t) => ({ id: t.id })),
                              }
                            : undefined,
                        estimate: data.estimate
                            ? {
                                  create: {
                                      ...data.estimate,
                                      activityId: activity.id,
                                  },
                              }
                            : undefined,
                        watchers: {
                            connect: [activity.id, owner.id].map((id) => ({ id })),
                        },
                        participants: {
                            connect: [activity.id, owner.id].map((id) => ({ id })),
                        },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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
            data: nonNull(arg({ type: GoalUpdateInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;
            if (!data.projectId) return null;

            const actualGoal = await db.goal.findUnique({
                where: { id: data.id },
                include: { participants: true, project: true, tags: true },
            });

            if (!actualGoal) return null;

            // FIXME: move out to separated mutations
            let participantsToDisconnect: Array<{ id: string }> = [];
            let tagsToDisconnect: Array<{ id: string }> = [];

            if (data.participants) {
                participantsToDisconnect =
                    actualGoal.participants
                        ?.filter((p) => !data.participants?.includes(p.id))
                        .map((a) => ({ id: a.id })) || [];
            }

            if (data.tags) {
                tagsToDisconnect =
                    actualGoal.tags
                        ?.filter((t) => !data.tags?.filter((tag) => tag.id === t.id).length)
                        .map((a) => ({ id: a.id })) || [];
            }

            try {
                if (actualGoal.projectId !== data.projectId) {
                    const project = await db.project.findUnique({
                        where: { id: data.projectId },
                    });

                    if (!project) return null;

                    // FIXME: https://github.com/taskany-inc/issues/issues/627
                    const pre = `${project.id}-`;
                    const lastGoal = await db.goal.findFirst({
                        where: { id: { contains: pre } },
                        orderBy: { createdAt: 'desc' },
                    });
                    const numId = lastGoal ? Number(lastGoal?.id?.replace(pre, '')) + 1 : 1;

                    data.id = `${pre}${numId}`;
                }

                return db.goal.update({
                    where: { id: actualGoal.id },
                    // @ts-ignore incompatible types of Goal and GoalUpdateInput
                    data: {
                        ...data,
                        estimate: data.estimate
                            ? {
                                  create: {
                                      ...data.estimate,
                                      activityId: activity.id,
                                  },
                              }
                            : undefined,
                        tags: data.tags
                            ? {
                                  connect: data.tags.map((t) => ({ id: t.id })),
                                  disconnect: tagsToDisconnect,
                              }
                            : undefined,
                        // @ts-ignore
                        participants: data.participants
                            ? {
                                  connect: data.participants?.map((id) => ({ id })),
                                  disconnect: participantsToDisconnect,
                              }
                            : undefined,
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('toggleGoalStargizer', {
        type: Activity,
        args: {
            data: nonNull(arg({ type: SubscriptionToggleInput })),
        },
        resolve: async (_, { data: { id, direction } }, { db, activity }) => {
            if (!activity) return null;

            const connection = { id };

            try {
                return db.activity.update({
                    where: { id: activity.id },
                    data: {
                        goalStargizers: { [connectionMap[String(direction)]]: connection },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('toggleGoalWatcher', {
        type: Activity,
        args: {
            data: nonNull(arg({ type: SubscriptionToggleInput })),
        },
        resolve: async (_, { data: { id, direction } }, { db, activity }) => {
            if (!activity) return null;

            const connection = { id };

            try {
                return db.activity.update({
                    where: { id: activity.id },
                    data: {
                        goalWatchers: { [connectionMap[String(direction)]]: connection },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('toggleGoalDependency', {
        type: Goal,
        args: {
            data: nonNull(arg({ type: GoalDependencyToggleInput })),
        },
        resolve: async (_, { data: { id, target, dependency, direction } }, { db, activity }) => {
            if (!activity) return null;

            const connection = { id: target };

            try {
                return db.goal.update({
                    where: { id },
                    data: {
                        id, // this is hack to force updatedAt field
                        [String(dependency)]: { [connectionMap[String(direction)]]: connection },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('toggleGoalArchive', {
        type: Activity,
        args: {
            data: nonNull(arg({ type: GoalArchiveInput })),
        },
        resolve: async (_, { data: { id, archived } }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.goal.update({
                    where: { id },
                    data: {
                        archived,
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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
