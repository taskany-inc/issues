import z from 'zod';
import { TRPCError } from '@trpc/server';
import { GoalHistory, Prisma } from '@prisma/client';

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
    goalStateChangeSchema,
    goalUpdateSchema,
    toggleGoalArchiveSchema,
    toggleGoalDependencySchema,
    userGoalsSchema,
    goalCommentSchema,
    toggleParticipantsSchema,
} from '../../src/schema/goal';
import { ToggleSubscriptionSchema, suggestionsQueryScheme, queryWithFiltersSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import {
    createGoal,
    changeGoalProject,
    getGoalHistory,
    findOrCreateEstimate,
    mixHistoryWithComments,
} from '../../src/utils/db';
import { createEmailJob } from '../../src/utils/worker/create';
import { calculateDiffBetweenArrays } from '../../src/utils/calculateDiffBetweenArrays';
import { criteriaSchema, removeCriteria, updateCriteriaState } from '../../src/schema/criteria';

import { addCalculatedProjectFields } from './project';

export const goal = router({
    suggestions: protectedProcedure.input(suggestionsQueryScheme).query(async ({ input }) => {
        const splittedInput = input.input.split('-');
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
            take: input.limit || 5,
            where: {
                OR: [
                    selectParams,
                    {
                        title: {
                            contains: input.input,
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
                ...goalDeepQuery,
            },
        });
    }),
    getBatch: protectedProcedure
        .input(
            z.object({
                query: queryWithFiltersSchema.optional(),
                limit: z.number(),
                cursor: z.string().nullish(),
                skip: z.number().optional(),
            }),
        )
        .query(async ({ ctx, input: { query, limit, skip, cursor } }) => {
            const [items, count] = await Promise.all([
                prisma.goal.findMany({
                    take: limit + 1,
                    skip,
                    cursor: cursor ? { id: cursor } : undefined,
                    ...(query ? goalsFilter(query, ctx.session.user.activityId) : {}),
                    orderBy: {
                        id: 'asc',
                    },
                    include: {
                        ...goalDeepQuery,
                    },
                }),
                prisma.goal.count(),
            ]);

            let nextCursor: typeof cursor | undefined;

            if (items.length > limit) {
                const nextItem = items.pop(); // return the last item from the array
                nextCursor = nextItem?.id;
            }

            return {
                items: items.map((g) => ({
                    ...g,
                    ...addCalclulatedGoalsFields(g, ctx.session.user.activityId),
                    estimate: getEstimateListFormJoin(g),
                    project: g.project ? addCalculatedProjectFields(g.project, ctx.session.user.activityId) : null,
                })),
                nextCursor,
                meta: {
                    count,
                    tags: [],
                    owners: [],
                    participants: [],
                    issuers: [],
                    priority: [],
                    states: [],
                    projects: [],
                    estimates: [],
                },
            };
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
                    goalAchiveCriteria: {
                        include: {
                            goalAsCriteria: {
                                include: {
                                    estimate: { include: { estimate: true } },
                                    activity: {
                                        include: {
                                            user: true,
                                            ghost: true,
                                        },
                                    },
                                    owner: {
                                        include: {
                                            user: true,
                                            ghost: true,
                                        },
                                    },
                                    state: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
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
                activityFeed: mixHistoryWithComments(history, goal.comments),
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
            prisma.goal.findMany({
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
    changeProject: protectedProcedure.input(goalChangeProjectSchema).mutation(async ({ ctx, input }) => {
        const actualGoal = await prisma.goal.findUnique({
            where: { id: input.id },
        });

        if (!actualGoal) return null;

        const { activityId } = ctx.session.user;

        try {
            await changeGoalProject(input.id, input.projectId);
            const goal = await prisma.goal.update({
                where: {
                    id: input.id,
                },
                data: {
                    history: {
                        create: {
                            activityId,
                            subject: 'project',
                            action: 'change',
                            previousValue: actualGoal.projectId,
                            nextValue: input.projectId,
                        },
                    },
                },
                include: {
                    ...goalDeepQuery,
                },
            });

            return {
                ...goal,
                ...addCalclulatedGoalsFields(goal, activityId),
            };
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    update: protectedProcedure.input(goalUpdateSchema).mutation(async ({ ctx, input }) => {
        const actualGoal = await prisma.goal.findUnique({
            where: { id: input.id },
            include: {
                participants: true,
                project: true,
                tags: true,
                estimate: {
                    include: { estimate: true },
                },
                owner: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!actualGoal) return null;

        const { _isEditable } = addCalclulatedGoalsFields(actualGoal, ctx.session.user.activityId);

        if (!_isEditable) {
            return null;
        }

        const tagsToDisconnect = calculateDiffBetweenArrays(actualGoal.tags, input.tags);
        const tagsToConnect = calculateDiffBetweenArrays(input.tags, actualGoal.tags);

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

        if (tagsToConnect.length || tagsToDisconnect.length) {
            const prevIds = actualGoal.tags.map(({ id }) => id).join(', ');
            const nextIds = input.tags.map(({ id }) => id).join(', ');

            history.push({
                subject: 'tags',
                action: 'change',
                previousValue: prevIds.length ? prevIds : null,
                nextValue: nextIds.length ? nextIds : null,
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

        const correctEstimate = await findOrCreateEstimate(input.estimate, ctx.session.user.activityId, actualGoal.id);
        const previousEstimate = actualGoal.estimate.length
            ? String(actualGoal.estimate[actualGoal.estimate.length - 1].estimateId)
            : '';
        if (correctEstimate && String(correctEstimate.id) !== previousEstimate) {
            history.push({
                subject: 'estimate',
                action: 'change',
                previousValue: previousEstimate,
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
                activityFeed: [],
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
    toggleArchive: protectedProcedure.input(toggleGoalArchiveSchema).mutation(({ input: { id, archived }, ctx }) => {
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
    switchState: protectedProcedure.input(goalStateChangeSchema).mutation(async ({ input, ctx }) => {
        const actualGoal = await prisma.goal.findFirst({
            where: {
                id: input.id,
            },
        });

        if (!actualGoal) {
            return null;
        }

        const { _isEditable } = addCalclulatedGoalsFields(actualGoal, ctx.session.user.activityId);

        if (!_isEditable) {
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
    createComment: protectedProcedure.input(goalCommentSchema).mutation(async ({ ctx, input }) => {
        if (!input.goalId) return null;

        const [commentAuthor, actualGoal] = await Promise.all([
            prisma.activity.findUnique({
                where: { id: ctx.session.user.activityId },
                include: { user: true, ghost: true },
            }),
            prisma.goal.findUnique({
                where: { id: input.goalId },
                include: {
                    participants: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                },
            }),
        ]);

        if (!commentAuthor) return null;
        if (!actualGoal) return null;

        const { _isEditable } = addCalclulatedGoalsFields(actualGoal, ctx.session.user.activityId);

        try {
            // We want to see state changes record and comment next in activity feed.
            const [, newComment] = await prisma.$transaction([
                // Update goal and push to history first.
                prisma.goal.update({
                    where: { id: input.goalId },
                    data: {
                        id: input.goalId,
                        stateId: _isEditable ? input.stateId : actualGoal.stateId,
                        history:
                            _isEditable && input.stateId && input.stateId !== actualGoal.stateId
                                ? {
                                      create: {
                                          subject: 'state',
                                          action: 'change',
                                          previousValue: actualGoal.stateId,
                                          nextValue: input.stateId,
                                          activityId: ctx.session.user.activityId,
                                      },
                                  }
                                : undefined,
                    },
                }),
                // Create comment next.
                prisma.comment.create({
                    data: {
                        description: input.description,
                        activityId: commentAuthor.id,
                        goalId: input.goalId,
                        stateId: _isEditable ? input.stateId : undefined,
                    },
                }),
            ]);

            let toEmails = actualGoal.participants;

            if (commentAuthor.user?.email === actualGoal.activity?.user?.email) {
                toEmails = toEmails.filter((p) => p.user?.email !== commentAuthor?.user?.email);
            }

            if (toEmails.length) {
                await createEmailJob('newComment', {
                    to: toEmails.map((p) => p.user?.email),
                    commentId: newComment.id,
                    goalId: input.goalId,
                });
            }

            return newComment;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    updateComment: protectedProcedure.input(goalCommentSchema).mutation(async ({ input: { id, description } }) => {
        try {
            const newComment = await prisma.comment.update({
                where: {
                    id,
                },
                data: {
                    description,
                },
            });

            return newComment;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    deleteComment: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
        try {
            return prisma.comment.delete({
                where: {
                    id,
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    addCriteria: protectedProcedure.input(criteriaSchema).mutation(async ({ input, ctx }) => {
        const actualGoal = await prisma.goal.findUnique({
            where: { id: input.goalId },
        });

        if (!actualGoal) {
            return null;
        }

        try {
            const [criteria] = await Promise.all([
                prisma.goalAchieveCriteria.create({
                    data: {
                        title: input.title,
                        weight: Number(input.weight),
                        activity: {
                            connect: {
                                id: ctx.session.user.activityId,
                            },
                        },
                        goal: {
                            connect: { id: input.goalId },
                        },
                        goalAsCriteria: input.goalAsGriteria?.id
                            ? {
                                  connect: { id: input.goalAsGriteria.id },
                              }
                            : undefined,
                    },
                }),
                // TODO: implements create new history record
                // prisma.goalHistory.create({
                //     data: {
                //         previousValue: null,
                //         nextValue: input.goalAsGriteria || input.title,
                //         action: 'add',
                //         subject: 'criteria',
                //         goal: {
                //             connect: {
                //                 id: input.linkedGoalId,
                //             },
                //         },
                //         activity: {
                //             connect: {
                //                 id: ctx.session.user.activityId,
                //             },
                //         },
                //     },
                // }),
            ]);

            return criteria;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    updateCriteriaState: protectedProcedure.input(updateCriteriaState).mutation(async ({ input }) => {
        const currentCriteria = await prisma.goalAchieveCriteria.findUnique({
            where: { id: input.id },
        });

        try {
            if (!currentCriteria) {
                throw Error('No current criteria');
            }

            await Promise.all([
                prisma.goalAchieveCriteria.update({
                    where: { id: input.id },
                    data: { isDone: input.isDone },
                }),
                // TODO: implements create new history record
                // prisma.goalHistory.create({
                //     data: {
                //         previousValue: input.isDone ? 'undone' : 'done',
                //         nextValue: input.isDone ? 'done' : 'undone',
                //         subject: 'criteria',
                //         action: 'change',
                //         goal: {
                //             connect: { id: currentCriteria.linkedGoalId },
                //         },
                //         activity: {
                //             connect: { id: ctx.session.user.activityId },
                //         },
                //     },
                // }),
            ]);
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    removeCriteria: protectedProcedure.input(removeCriteria).mutation(async ({ input }) => {
        try {
            await prisma.goalAchieveCriteria.delete({
                where: { id: input.id },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    addParticipant: protectedProcedure.input(toggleParticipantsSchema).mutation(async ({ input, ctx }) => {
        try {
            return prisma.goal.update({
                where: { id: input.id },
                data: {
                    participants: {
                        connect: [{ id: input.activityId }],
                    },
                    history: {
                        create: {
                            subject: 'participants',
                            action: 'add',
                            nextValue: input.activityId,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    removeParticipant: protectedProcedure.input(toggleParticipantsSchema).mutation(async ({ input, ctx }) => {
        try {
            return prisma.goal.update({
                where: { id: input.id },
                data: {
                    participants: {
                        disconnect: [{ id: input.activityId }],
                    },
                    history: {
                        create: {
                            subject: 'participants',
                            action: 'remove',
                            nextValue: input.activityId,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    addDependency: protectedProcedure.input(toggleGoalDependencySchema).mutation(async ({ input, ctx }) => {
        try {
            return prisma.goal.update({
                where: { id: input.id },
                data: {
                    [input.kind]: {
                        connect: { id: input.relation?.id },
                    },
                    history: {
                        create: {
                            subject: 'dependencies',
                            action: 'add',
                            nextValue: input.relation.id,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    removeDependency: protectedProcedure.input(toggleGoalDependencySchema).mutation(async ({ input, ctx }) => {
        try {
            return prisma.goal.update({
                where: { id: input.id },
                data: {
                    [input.kind]: {
                        disconnect: { id: input.relation?.id },
                    },
                    history: {
                        create: {
                            subject: 'dependencies',
                            action: 'remove',
                            nextValue: input.relation.id,
                            activityId: ctx.session.user.activityId,
                        },
                    },
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
});
