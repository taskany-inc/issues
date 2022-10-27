import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import {
    Goal,
    GoalUpdateInput,
    GoalCreateInput,
    SubscriptionToggleInput,
    Activity,
    GoalDependencyToggleInput,
    dependencyKind,
    UserGoalsInput,
    Project,
} from '../types';
// import { mailServer } from '../src/utils/mailServer';

const connectionMap: Record<string, string> = {
    true: 'connect',
    false: 'disconnect',
};

const projectGoalsFilter = (data: { query: string; states: string[]; tags: string[]; owner: string[] }): any => {
    const statesFilter = data.states.length
        ? {
              state: {
                  id: {
                      in: data.states,
                  },
              },
          }
        : {};

    const tagsFilter = data.tags.length
        ? {
              tags: {
                  some: {
                      id: {
                          in: data.tags,
                      },
                  },
              },
          }
        : {};

    const ownerFilter = data.owner.length
        ? {
              owner: {
                  id: {
                      in: data.owner,
                  },
              },
          }
        : {};

    return {
        where: {
            OR: [
                {
                    title: {
                        contains: data.query,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: data.query,
                        mode: 'insensitive',
                    },
                },
            ],
            ...statesFilter,
            ...tagsFilter,
            ...ownerFilter,
        },
    };
};

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('userGoals', {
        type: Project,
        args: {
            data: nonNull(arg({ type: UserGoalsInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            return db.project.findMany({
                where: {
                    OR: [
                        {
                            activityId: activity.id,
                        },
                        {
                            participants: {
                                some: {
                                    id: activity.id,
                                },
                            },
                        },
                        {
                            watchers: {
                                some: {
                                    id: activity.id,
                                },
                            },
                        },
                        {
                            goals: {
                                some: {
                                    participants: {
                                        some: {
                                            id: activity.id,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            goals: {
                                some: {
                                    watchers: {
                                        some: {
                                            id: activity.id,
                                        },
                                    },
                                },
                            },
                        },
                    ],
                },
                include: {
                    goals: {
                        ...projectGoalsFilter(data),
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
                            comments: true,
                        },
                    },
                },
            });
        },
    });

    t.field('goal', {
        type: Goal,
        args: {
            id: nonNull(stringArg()),
        },
        resolve: async (_, { id }, { db, activity }) => {
            if (!activity) return null;

            return db.goal.findUnique({
                where: {
                    id,
                },
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

            const [owner, project] = await Promise.all([
                db.activity.findUnique({ where: { id: data.ownerId } }),
                db.project.findUnique({ where: { id: data.projectId } }),
            ]);

            const goalsCount = await db.goal.count({ where: { id: { contains: project?.key } } });

            if (!owner?.id) return null;

            try {
                await db.project.update({
                    where: {
                        key: project?.key,
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

                return db.goal.create({
                    data: {
                        ...data,
                        id: `${project?.key}-${goalsCount + 1}`,
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
                include: { participants: true, project: true, tags: true },
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
                await db.project.update({
                    where: {
                        key: actualGoal.project?.key,
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
            toggle: nonNull(arg({ type: SubscriptionToggleInput })),
        },
        resolve: async (_, { toggle: { id, direction } }, { db, activity }) => {
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
            toggle: nonNull(arg({ type: SubscriptionToggleInput })),
        },
        resolve: async (_, { toggle: { id, direction } }, { db, activity }) => {
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
};
