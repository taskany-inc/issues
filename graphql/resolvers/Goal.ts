import { arg, nonNull, stringArg, intArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import {
    Goal,
    GoalInput,
    computeUserFields,
    withComputedField,
    GoalCreateInput,
    GoalSubscriptionInput,
    Activity,
    GoalDependencyInput,
    dependencyKind,
} from '../types';
// import { mailServer } from '../src/utils/mailServer';

const connectionMap: Record<string, string> = {
    true: 'connect',
    false: 'disconnect',
};

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
                    comments: true,
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
                    comments: {
                        include: {
                            activity: {
                                ...computeUserFields,
                            },
                            reactions: true,
                        },
                    },
                    participants: {
                        ...computeUserFields,
                    },
                },
            });

            const computedCommentAuthor = goal?.comments.map((comment) => withComputedField('author')(comment));
            if (goal && computedCommentAuthor) {
                goal.comments = computedCommentAuthor;
            }
            return withComputedField('owner', 'activity')(goal);
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
                    comments: {
                        include: {
                            activity: {
                                ...computeUserFields,
                            },
                            reactions: true,
                        },
                    },
                    participants: {
                        ...computeUserFields,
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
            goal: nonNull(arg({ type: GoalCreateInput })),
        },
        resolve: async (_, { goal }, { db, activity }) => {
            if (!activity) return null;
            if (!goal.projectId) return null;
            if (!goal.ownerId) return null;

            const [owner, project, goalsCount] = await Promise.all([
                db.user.findUnique({ where: { id: goal.ownerId } }),
                db.project.findUnique({ where: { id: goal.projectId } }),
                db.goal.count(),
            ]);

            if (!owner?.activityId) return null;

            try {
                return db.goal.create({
                    data: {
                        ...goal,
                        id: `${project?.key}-${goalsCount + 1}`,
                        activityId: activity.id,
                        ownerId: owner?.activityId,
                        tags: goal.tags?.length
                            ? {
                                  connect: goal.tags.map((t) => ({ id: t!.id })),
                              }
                            : undefined,
                        estimate: goal.estimate
                            ? {
                                  create: {
                                      ...goal.estimate,
                                      activityId: activity.id,
                                  },
                              }
                            : undefined,
                        watchers: {
                            connect: [activity.id, owner.activityId].map((id) => ({ id })),
                        },
                        participants: {
                            connect: [activity.id, owner.activityId].map((id) => ({ id })),
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
            goal: nonNull(arg({ type: GoalInput })),
        },
        resolve: async (_, { goal }, { db, activity }) => {
            if (!activity) return null;
            const actualGoal = await db.goal.findUnique({ where: { id: goal.id }, include: { participants: true } });

            let participantsToDisconnect: Array<{ id: string }> = [];

            if (goal.participants) {
                participantsToDisconnect =
                    actualGoal?.participants
                        ?.filter((p) => !goal.participants?.includes(p!.id))
                        .map((a) => ({ id: a.id })) || [];
            }

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
                        tags: goal.tags
                            ? {
                                  connect: goal.tags.map((t) => ({ id: t!.id })),
                              }
                            : undefined,
                        // @ts-ignore
                        participants: goal.participants
                            ? {
                                  connect: goal.participants.map((id) => ({ id })),
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
            toggle: nonNull(arg({ type: GoalSubscriptionInput })),
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
            toggle: nonNull(arg({ type: GoalSubscriptionInput })),
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
            toggle: nonNull(arg({ type: GoalDependencyInput })),
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
