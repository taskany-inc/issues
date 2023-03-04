import { PrismaClient } from '@prisma/client';
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
    GoalsMetaOutput,
} from '../types';
// import { mailServer } from '../src/utils/mailServer';

const goalsQuery = async (
    db: PrismaClient,
    activityId: string,
    parentFilter: ReturnType<typeof goalsFilter> = {},
    childrenFilter: ReturnType<typeof goalsFilter> = {},
) => {
    const uniqGoals = new Map();

    const [teams, projects, goals] = await Promise.all([
        db.team.findMany({
            where: {
                OR: [
                    // all teams where the user is a participant
                    {
                        participants: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all teams where the user is a watcher
                    {
                        watchers: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all teams where the user is owner
                    {
                        activityId,
                    },
                ],
            },
            include: {
                goals: {
                    ...parentFilter,
                    include: {
                        ...goalDeepQuery,
                    },
                },
                projects: {
                    include: {
                        goals: {
                            ...parentFilter,
                            include: {
                                ...goalDeepQuery,
                            },
                        },
                    },
                },
            },
        }),

        db.project.findMany({
            where: {
                OR: [
                    // all projects where the user is a participant
                    {
                        participants: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all projects where the user is a watcher
                    {
                        watchers: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all projects where the user is owner
                    {
                        activityId,
                    },
                ],
            },
            include: {
                goals: {
                    ...parentFilter,
                    include: {
                        ...goalDeepQuery,
                    },
                },
            },
        }),

        db.goal.findMany({
            ...childrenFilter,
            include: {
                ...goalDeepQuery,
            },
        }),
    ]);

    teams.forEach((team) => {
        team.goals.forEach((goal: any) => uniqGoals.set(goal.id, goal));
        team.projects.forEach((project) => {
            project.goals.forEach((goal: any) => uniqGoals.set(goal.id, goal));
        });
    });

    projects.forEach((project) => {
        project.goals.forEach((goal: any) => uniqGoals.set(goal.id, goal));
    });

    goals.forEach((goal) => uniqGoals.set(goal.id, goal));

    return Array.from(uniqGoals.values()).map((goal) => ({
        ...goal,
        ...addCalclulatedGoalsFields(goal, activityId),
    }));
};

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('userGoals', {
        type: Goal,
        args: {
            data: nonNull(arg({ type: UserGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            return goalsQuery(
                db,
                activity.id,
                goalsFilter(data),
                goalsFilter(data, {
                    AND: {
                        OR: [
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
                }),
            );
        },
    });

    t.field('userGoalsMeta', {
        type: GoalsMetaOutput,
        args: {
            data: nonNull(arg({ type: UserGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            const allUserGoals = await goalsQuery(
                db,
                activity.id,
                goalsFilter(data),
                goalsFilter(data, {
                    AND: {
                        OR: [
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
                }),
            );

            return calcGoalsMeta(allUserGoals);
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
            if (!data.parent) return null;
            if (!data.kind) return null;
            if (!data.ownerId) return null;

            const promises: Promise<any>[] = [db.activity.findUnique({ where: { id: data.ownerId } })];

            switch (data.kind) {
                case 'project':
                    promises.push(db.project.findUnique({ where: { id: data.parent } }));
                    break;
                case 'team':
                    promises.push(db.team.findUnique({ where: { id: data.parent } }));
                    break;
                default:
                    break;
            }

            const [owner, parent] = await Promise.all(promises);

            if (!owner?.id) return null;
            if (!parent?.id) return null;

            const pre = `${parent?.key}-`;

            const lastGoal = await db.goal.findFirst({
                where: { id: { contains: pre } },
                orderBy: { createdAt: 'desc' },
            });

            const numId = lastGoal ? Number(lastGoal?.id?.replace(pre, '')) + 1 : 1;
            const id = `${pre}${numId}`;

            const goalFields: any = {
                ...data,
            };

            try {
                switch (data.kind) {
                    case 'project':
                        goalFields.projectId = data.parent;

                        await db.project.update({
                            where: {
                                key: parent.key,
                            },
                            data: {
                                tags: data.tags?.length
                                    ? {
                                          connect: data.tags.map((t) => ({ id: t!.id })),
                                      }
                                    : undefined,
                                participants: {
                                    connect: [{ id: owner.id }],
                                },
                            },
                        });
                        break;

                    case 'team':
                        goalFields.teamId = data.parent;

                        await db.team.update({
                            where: {
                                key: parent.key,
                            },
                            data: {
                                participants: {
                                    connect: [{ id: owner.id }],
                                },
                            },
                        });
                        break;
                    default:
                        break;
                }

                delete goalFields.parent;

                return db.goal.create({
                    data: {
                        ...goalFields,
                        id,
                        activityId: activity.id,
                        ownerId: owner?.id,
                        tags: data.tags?.length
                            ? {
                                  connect: data.tags.map((t) => ({ id: t!.id })),
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
            const actualGoal = await db.goal.findUnique({
                where: { id: data.id },
                include: { participants: true, project: true, team: true, tags: true },
            });

            if (!actualGoal) return null;

            let participantsToDisconnect: Array<{ id: string }> = [];
            let tagsToDisconnect: Array<{ id: string }> = [];

            if (data.participants) {
                participantsToDisconnect =
                    actualGoal.participants
                        ?.filter((p) => !data.participants?.includes(p!.id))
                        .map((a) => ({ id: a.id })) || [];
            }

            if (data.tags) {
                tagsToDisconnect =
                    actualGoal.tags
                        ?.filter((t) => !data.tags?.filter((tag) => tag!.id === t.id).length)
                        .map((a) => ({ id: a.id })) || [];
            }

            try {
                switch (data.kind) {
                    case 'project':
                        if (actualGoal.kind === 'project' && actualGoal.projectId !== data.parent) {
                            await db.project.update({
                                where: {
                                    id: actualGoal.projectId!,
                                },
                                data: {
                                    goals: {
                                        disconnect: [{ id: actualGoal.id }],
                                    },
                                },
                            });

                            const project = await db.project.findUnique({
                                where: { id: data.parent! },
                            });

                            if (!project) return null;

                            const pre = `${project.key}-`;

                            const lastGoal = await db.goal.findFirst({
                                where: { id: { contains: pre } },
                                orderBy: { createdAt: 'desc' },
                            });

                            const numId = lastGoal ? Number(lastGoal?.id?.replace(pre, '')) + 1 : 1;
                            const id = `${pre}${numId}`;

                            await db.goal.update({
                                where: { id: actualGoal.id },
                                data: {
                                    id,
                                },
                            });

                            await db.project.update({
                                where: {
                                    id: data.parent!,
                                },
                                data: {
                                    goals: {
                                        connect: [{ id }],
                                    },
                                },
                            });

                            data.id = id;
                        }

                        if (actualGoal.kind === 'team') {
                            await db.team.update({
                                where: {
                                    id: actualGoal.teamId!,
                                },
                                data: {
                                    goals: {
                                        disconnect: [{ id: actualGoal.id }],
                                    },
                                },
                            });

                            const project = await db.project.findUnique({
                                where: { id: data.parent! },
                            });

                            if (!project) return null;

                            const pre = `${project.key}-`;

                            const lastGoal = await db.goal.findFirst({
                                where: { id: { contains: pre } },
                                orderBy: { createdAt: 'desc' },
                            });

                            const numId = lastGoal ? Number(lastGoal?.id?.replace(pre, '')) + 1 : 1;
                            const id = `${pre}${numId}`;

                            await db.goal.update({
                                where: { id: actualGoal.id },
                                data: {
                                    kind: 'project',
                                    id,
                                },
                            });

                            await db.project.update({
                                where: {
                                    id: data.parent!,
                                },
                                data: {
                                    goals: {
                                        connect: [{ id }],
                                    },
                                },
                            });

                            data.id = id;
                        }

                        await db.project.update({
                            where: {
                                id: data.parent!,
                            },
                            data: {
                                tags: data.tags
                                    ? {
                                          connect: data.tags.map((t) => ({ id: t!.id })),
                                          disconnect: tagsToDisconnect,
                                      }
                                    : undefined,
                                participants: {
                                    connect: [{ id: data.ownerId! || actualGoal.ownerId! }],
                                },
                            },
                        });
                        break;
                    case 'team':
                        if (actualGoal.kind === 'project') {
                            await db.project.update({
                                where: {
                                    id: actualGoal.projectId!,
                                },
                                data: {
                                    goals: {
                                        disconnect: [{ id: actualGoal.id }],
                                    },
                                },
                            });

                            const team = await db.team.findUnique({
                                where: { id: data.parent! },
                            });

                            if (!team) return null;

                            const pre = `${team.key}-`;

                            const lastGoal = await db.goal.findFirst({
                                where: { id: { contains: pre } },
                                orderBy: { createdAt: 'desc' },
                            });

                            const numId = lastGoal ? Number(lastGoal?.id?.replace(pre, '')) + 1 : 1;
                            const id = `${pre}${numId}`;

                            await db.goal.update({
                                where: { id: actualGoal.id },
                                data: {
                                    kind: 'team',
                                    id,
                                },
                            });

                            await db.team.update({
                                where: {
                                    id: data.parent!,
                                },
                                data: {
                                    goals: {
                                        connect: [{ id }],
                                    },
                                },
                            });

                            data.id = id;
                        }

                        await db.team.update({
                            where: {
                                id: data.parent!,
                            },
                            data: {
                                participants: {
                                    connect: [{ id: data.ownerId! || actualGoal.ownerId! }],
                                },
                            },
                        });
                        break;
                    default:
                        break;
                }

                delete data.parent;
                delete data.kind;

                return db.goal.update({
                    where: { id: data.id },
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
                                  connect: data.tags.map((t) => ({ id: t!.id })),
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
            toggle: nonNull(arg({ type: GoalDependencyToggleInput })),
        },
        resolve: async (_, { toggle: { id, target, dependency, direction } }, { db, activity }) => {
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
