import z from 'zod';
import { TRPCError } from '@trpc/server';
import { GoalHistory, Prisma, Tag } from '@prisma/client';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import {
    addCalclulatedGoalsFields,
    calcGoalsMeta,
    goalDeepQuery,
    goalsFilter,
    getEstimateListFormJoin,
} from '../queries/goals';
import {
    goalChangeProjectSchema,
    goalCommonSchema,
    goalParticipantsSchema,
    goalStateChangeSchema,
    goalUpdateSchema,
    GoalUpdate,
    toogleGoalArchiveSchema,
    toogleGoalDependencySchema,
    userGoalsSchema,
    goalCreateCommentSchema,
} from '../../src/schema/goal';
import { ToggleSubscriptionSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import { createGoal, changeGoalProject, getGoalHistory, findOrCreateEstimate } from '../../src/utils/db';
import { createEmailJob } from '../../src/utils/worker/create';

import { addCalculatedProjectFields } from './project';

export const goal = router({
    suggestions: protectedProcedure.input(z.string()).query(async ({ input }) => {
        const splittedInput = input.split('-');
        let selectParams = {};

        if (splittedInput.length === 2 && Number.isNaN(+splittedInput[1])) {
            selectParams = {
                AND: [
                    {
                        projectId: {
                            contains: splittedInput[0],
                            mode: 'insensitive',
                        },
                    },
                    {
                        scopeId: {
                            contains: splittedInput[1],
                            mode: 'insensitive',
                        },
                    },
                ],
            };
        }

        return prisma.goal.findMany({
            take: 10,
            where: {
                OR: [
                    selectParams,
                    {
                        title: {
                            contains: input,
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
    }),
    getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        // try to recognize shot id like: FRNTND-23
        const [projectId, scopeIdStr] = input.split('-');

        if (!projectId) return null;

        const scopeId = parseInt(scopeIdStr, 10);

        if (!scopeId) return null;

        try {
            const goal = await prisma.goal.findFirst({
                where: {
                    projectId,
                    scopeId,
                    archived: false,
                },
                include: {
                    ...goalDeepQuery,
                    estimate: {
                        include: {
                            estimate: true,
                        },
                        where: {
                            goal: {
                                projectId,
                                scopeId,
                                archived: false,
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            });

            if (!goal) return null;

            const history = await getGoalHistory(goal.history || [], goal.id);

            return {
                ...goal,
                ...addCalclulatedGoalsFields(goal, ctx.session.user.activityId),
                project: goal.project ? addCalculatedProjectFields(goal.project, ctx.session.user.activityId) : null,
                estimate: getEstimateListFormJoin(goal),
                history,
            };
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    getUserGoals: protectedProcedure.input(userGoalsSchema).query(async ({ ctx, input }) => {
        const { activityId } = ctx.session.user;

        const userDashboardGoals: Prisma.GoalFindManyArgs['where'] = {
            AND: {
                OR: [
                    // all projects where the user is a participant
                    {
                        project: {
                            participants: {
                                some: {
                                    id: activityId,
                                },
                            },
                        },
                    },
                    // all projects where the user is a watcher
                    {
                        project: {
                            watchers: {
                                some: {
                                    id: activityId,
                                },
                            },
                        },
                    },
                    // all projects where the user is owner
                    {
                        project: {
                            activityId,
                        },
                    },
                    // all goals where the user is a participant
                    {
                        participants: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all goals where the user is a watcher
                    {
                        watchers: {
                            some: {
                                id: activityId,
                            },
                        },
                    },
                    // all goals where the user is issuer
                    {
                        activityId,
                    },
                    // all goals where the user is owner
                    {
                        ownerId: activityId,
                    },
                ],
            },
        };

        const [allUserGoals, filtredUserGoals] = await Promise.all([
            prisma.goal.findMany({
                ...goalsFilter(
                    {
                        priority: [],
                        state: [],
                        tag: [],
                        estimate: [],
                        owner: [],
                        project: [],
                        sort: {},
                        query: '',
                    },
                    ctx.session.user.activityId,
                    {
                        ...userDashboardGoals,
                    },
                ),
                include: {
                    ...goalDeepQuery,
                    estimate: {
                        include: {
                            estimate: true,
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            }),
            prisma.goal.findMany<{
                include: typeof goalDeepQuery;
            }>({
                ...goalsFilter(input, ctx.session.user.activityId, {
                    ...userDashboardGoals,
                }),
                include: {
                    ...goalDeepQuery,
                    estimate: {
                        include: {
                            estimate: true,
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            }),
        ]);

        return {
            goals: filtredUserGoals.map((g) => ({
                ...g,
                ...addCalclulatedGoalsFields(g, ctx.session.user.activityId),
                estimate: getEstimateListFormJoin(g),
                project: g.project ? addCalculatedProjectFields(g.project, ctx.session.user.activityId) : null,
            })),
            meta: calcGoalsMeta(allUserGoals),
        };
    }),
    create: protectedProcedure.input(goalCommonSchema).mutation(async ({ ctx, input }) => {
        if (!input.owner.id) return null;
        if (!input.parent.id) return null;

        const { activityId } = ctx.session.user;

        try {
            return createGoal(activityId, input);

            // await mailServer.sendMail({
            //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
            //     to: 'bar@example.com, baz@example.com',
            //     subject: 'Hello ✔',
            //     text: `new post '${title}'`,
            //     html: `new post <b>${title}</b>`,
            // });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    changeProject: protectedProcedure.input(goalChangeProjectSchema).mutation(async ({ input }) => {
        return changeGoalProject(input.id, input.projectId);
    }),
    update: protectedProcedure.input(goalUpdateSchema).mutation(async ({ ctx, input }) => {
        const actualGoal = await prisma.goal.findUnique({
            where: { id: input.id },
            include: {
                participants: true,
                project: true,
                tags: true,
                estimate: true,
                owner: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!actualGoal) return null;

        const tagsToDisconnect: Array<Tag> =
            actualGoal.tags.filter((t) => !input.tags.some((tag) => tag.id === t.id)) || [];
        const tagsToConnect: GoalUpdate['tags'] =
            input.tags.filter((t) => !actualGoal.tags.some((tag) => tag.id === t.id)) || [];

        const history: Omit<GoalHistory, 'id' | 'activityId' | 'goalId' | 'createdAt'>[] = [];

        if (actualGoal.title !== input.title) {
            history.push({
                subject: 'title',
                action: 'change',
                previousValue: actualGoal.title,
                nextValue: input.title,
            });
        }

        if (actualGoal.description !== input.description) {
            history.push({
                subject: 'description',
                action: 'change',
                previousValue: actualGoal.description,
                nextValue: input.description,
            });
        }

        if (tagsToDisconnect.length) {
            history.push({
                subject: 'tags',
                action: 'remove',
                previousValue: actualGoal.tags?.map(({ id }) => id).join(', '),
                nextValue: tagsToDisconnect.map(({ id }) => id).join(', '),
            });
        }

        if (tagsToConnect.length) {
            history.push({
                subject: 'tags',
                action: 'add',
                previousValue: actualGoal.tags?.map(({ id }) => id).join(', '),
                nextValue: tagsToConnect.map(({ id }) => id).join(', '),
            });
        }

        if (actualGoal.priority !== input.priority) {
            history.push({
                subject: 'priority',
                action: 'change',
                previousValue: actualGoal.priority,
                nextValue: input.priority,
            });
        }

        if (actualGoal.ownerId !== input.owner.id) {
            history.push({
                subject: 'owner',
                action: 'change',
                previousValue: actualGoal.ownerId,
                nextValue: input.owner.id,
            });
        }

        if (actualGoal.projectId !== input.parent.id) {
            history.push({
                subject: 'project',
                action: 'change',
                previousValue: actualGoal.projectId,
                nextValue: input.parent.id,
            });

            // FIXME: remove this monkey patch after adding button to changeProject separately
            const movedGoal = await changeGoalProject(actualGoal.id, input.parent.id);
            if (movedGoal) {
                actualGoal.id = movedGoal.id;
                actualGoal.projectId = movedGoal.projectId;
                actualGoal.scopeId = movedGoal.scopeId;
            }
        }

        const correctEstimate = await findOrCreateEstimate(input.estimate, ctx.session.user.activityId, actualGoal.id);

        if (correctEstimate) {
            history.push({
                subject: 'estimate',
                action: 'change',
                previousValue: actualGoal.estimate.length
                    ? String(actualGoal.estimate[actualGoal.estimate.length - 1].estimateId)
                    : '',
                nextValue: String(correctEstimate.id),
            });
        }

        try {
            const goal = await prisma.goal.update({
                where: { id: actualGoal.id },
                data: {
                    ownerId: input.owner?.id,
                    title: input.title,
                    description: input.description,
                    stateId: input.state?.id,
                    priority: input.priority,
                    estimate: correctEstimate?.id
                        ? {
                              create: {
                                  estimate: {
                                      connect: {
                                          id: correctEstimate.id,
                                      },
                                  },
                              },
                          }
                        : undefined,
                    tags: {
                        connect: tagsToConnect.map(({ id }) => ({ id })),
                        disconnect: tagsToDisconnect.map(({ id }) => ({ id })),
                    },
                    history: {
                        createMany: {
                            data: history.map((record) => ({ ...record, activityId: ctx.session.user.activityId })),
                        },
                    },
                },
                include: {
                    ...goalDeepQuery,
                },
            });

            return {
                ...goal,
                ...addCalclulatedGoalsFields(goal, ctx.session.user.activityId),
                project: goal.project ? addCalculatedProjectFields(goal.project, ctx.session.user.activityId) : null,
                estimate: getEstimateListFormJoin(goal),
            };

            // await mailServer.sendMail({
            //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
            //     to: 'bar@example.com, baz@example.com',
            //     subject: 'Hello ✔',
            //     text: `new post '${title}'`,
            //     html: `new post <b>${title}</b>`,
            // });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    toggleStargizer: protectedProcedure
        .input(ToggleSubscriptionSchema)
        .mutation(({ ctx, input: { id, direction } }) => {
            const connection = { id };

            try {
                return prisma.activity.update({
                    where: { id: ctx.session.user.activityId },
                    data: {
                        goalStargizers: { [connectionMap[String(direction)]]: connection },
                    },
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    toggleWatcher: protectedProcedure.input(ToggleSubscriptionSchema).mutation(({ ctx, input: { id, direction } }) => {
        const connection = { id };

        try {
            return prisma.activity.update({
                where: { id: ctx.session.user.activityId },
                data: {
                    goalWatchers: { [connectionMap[String(direction)]]: connection },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    toggleDependency: protectedProcedure
        .input(toogleGoalDependencySchema)
        .mutation(({ input: { id, target, direction, kind }, ctx }) => {
            const connection = { id: target };

            try {
                return prisma.goal.update({
                    where: { id },
                    data: {
                        id, // this is hack to force updatedAt field
                        [kind]: { [connectionMap[String(direction)]]: connection },
                        history: {
                            create: {
                                activityId: ctx.session.user.activityId,
                                subject: 'dependencies',
                                action: direction ? 'add' : 'remove',
                                nextValue: target,
                            },
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
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    toggleArchive: protectedProcedure.input(toogleGoalArchiveSchema).mutation(({ input: { id, archived }, ctx }) => {
        try {
            return prisma.goal.update({
                where: { id },
                data: {
                    archived,
                    history: {
                        create: {
                            subject: 'state',
                            action: 'archive',
                            activityId: ctx.session.user.activityId,
                            nextValue: archived ? 'move to archive' : 'move from archive',
                        },
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
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    toggleParticipants: protectedProcedure.input(goalParticipantsSchema).mutation(async ({ input, ctx }) => {
        const [projectId, scopeIdStr] = input.id.split('-');

        if (!projectId) return null;

        const scopeId = parseInt(scopeIdStr, 10);

        if (!scopeId) return null;

        const actualGoal = await prisma.goal.findFirst({
            where: { projectId, scopeId },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!actualGoal) {
            return null;
        }

        const participantsToDisconnect = actualGoal.participants
            .filter((p) => !input.participants?.some((pa) => pa.id === p.id))
            .map(({ id }) => ({ id }));

        const hash = new Set(
            actualGoal.participants.map(({ id }) => id).concat(input.participants.map(({ id }) => id)),
        );

        const simpliestList = actualGoal.participants.reduce<typeof input.participants>((acc, { id, user }) => {
            if (user) {
                acc.push({
                    id,
                    name: user.nickname ?? user.name ?? user.email,
                });
            }

            return acc;
        }, []);

        const shortList = participantsToDisconnect.length ? input.participants : simpliestList;
        const action = participantsToDisconnect.length ? 'remove' : 'add';

        for (const { id } of shortList) {
            hash.delete(id);
        }

        const [diffId] = Array.from(hash);

        try {
            return prisma.goal.update({
                where: {
                    id: actualGoal.id,
                },
                data: {
                    id: actualGoal.id,
                    participants: {
                        connect: input.participants.map(({ id }) => ({ id })),
                        disconnect: participantsToDisconnect,
                    },
                    history: {
                        create: {
                            subject: 'participants',
                            action,
                            nextValue: diffId,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ message: String(error.message), code: 'INTERNAL_SERVER_ERROR', cause: error });
        }
    }),
    switchState: protectedProcedure.input(goalStateChangeSchema).mutation(async ({ input, ctx }) => {
        const actualGoal = await prisma.goal.findFirst({
            where: {
                id: input.id,
            },
        });

        if (!actualGoal) {
            return null;
        }

        try {
            return await prisma.goal.update({
                where: {
                    id: input.id,
                },
                data: {
                    id: input.id,
                    stateId: input.state.id,
                    history: {
                        create: {
                            subject: 'state',
                            action: 'change',
                            previousValue: actualGoal.stateId,
                            nextValue: input.state.id,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    createComment: protectedProcedure.input(goalCreateCommentSchema).mutation(async ({ ctx, input }) => {
        const [commentAuthor, goal] = await Promise.all([
            prisma.activity.findUnique({
                where: { id: ctx.session.user.activityId },
                include: { user: true, ghost: true },
            }),
            prisma.goal.findUnique({
                where: { id: input.id },
                include: {
                    participants: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                },
            }),
        ]);

        if (!commentAuthor) return null;
        if (!goal) return null;

        try {
            const [newComment] = await Promise.all([
                prisma.comment.create({
                    data: {
                        description: input.description,
                        activityId: commentAuthor.id,
                        goalId: input.id,
                        stateId: input.stateId,
                    },
                }),
                prisma.goal.update({
                    where: { id: input.id },
                    data: {
                        id: input.id,
                        stateId: input.stateId,
                        history:
                            input.stateId && input.stateId !== goal.stateId
                                ? {
                                      create: {
                                          subject: 'state',
                                          action: 'change',
                                          previousValue: goal.stateId,
                                          nextValue: input.stateId,
                                          activityId: ctx.session.user.activityId,
                                      },
                                  }
                                : undefined,
                    },
                }),
            ]);

            let toEmails = goal.participants;

            if (commentAuthor.user?.email === goal.activity?.user?.email) {
                toEmails = toEmails.filter((p) => p.user?.email !== commentAuthor?.user?.email);
            }

            if (toEmails.length) {
                await createEmailJob('newComment', {
                    to: toEmails.map((p) => p.user?.email),
                    commentId: newComment.id,
                    goalId: input.id,
                });
            }

            return newComment;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
});
