import z from 'zod';
import { TRPCError } from '@trpc/server';
import { GoalHistory, Prisma, StateType } from '@prisma/client';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { addCalclulatedGoalsFields, goalDeepQuery, goalsFilter, nonArchievedGoalsPartialQuery } from '../queries/goals';
import { commentEditSchema } from '../../src/schema/comment';
import {
    goalChangeProjectSchema,
    goalCommonSchema,
    goalStateChangeSchema,
    goalUpdateSchema,
    toggleGoalArchiveSchema,
    toggleGoalDependencySchema,
    goalCommentCreateSchema,
    toggleParticipantsSchema,
    batchGoalByProjectIdSchema,
} from '../../src/schema/goal';
import { ToggleSubscriptionSchema, suggestionsQuerySchema, queryWithFiltersSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import {
    createGoal,
    changeGoalProject,
    getGoalHistory,
    mixHistoryWithComments,
    makeGoalRelationMap,
    updateGoalWithCalculatedWeight,
    goalHistorySeparator,
} from '../../src/utils/db';
import { createEmailJob } from '../../src/utils/worker/create';
import { calculateDiffBetweenArrays } from '../../src/utils/calculateDiffBetweenArrays';
import {
    convertCriteriaToGoalSchema,
    criteriaSchema,
    removeCriteria,
    updateCriteriaSchema,
    updateCriteriaState,
} from '../../src/schema/criteria';
import type { FieldDiff } from '../../src/types/common';
import { encodeHistoryEstimate, formateEstimate } from '../../src/utils/dateTime';
import { goalAccessMiddleware, commentAccessMiddleware, criteriaAccessMiddleware } from '../access/accessMiddlewares';
import { addCalculatedProjectFields } from '../queries/project';

const updateProjectUpdatedAt = async (id?: string | null) => {
    if (!id) return;

    return prisma.project.update({
        where: { id },
        data: { id },
    });
};
export const goal = router({
    suggestions: protectedProcedure
        .input(suggestionsQuerySchema)
        .query(async ({ ctx, input: { input, limit = 5 } }) => {
            const { activityId } = ctx.session.user || {};

            const splittedInput = input.split('-');
            let selectParams: Prisma.GoalFindManyArgs['where'] = {
                title: {
                    contains: input,
                    mode: 'insensitive',
                },
            };

            if (splittedInput.length === 2 && !Number.isNaN(+splittedInput[1])) {
                const [projectId, scopedId] = splittedInput;
                selectParams = {
                    AND: [
                        {
                            projectId: {
                                contains: projectId,
                                mode: 'insensitive',
                            },
                        },
                        {
                            scopeId: Number(scopedId),
                        },
                    ],
                };
            }

            return prisma.goal.findMany({
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                where: {
                    activityId: input.length ? { contains: '' } : activityId,
                    ...nonArchievedGoalsPartialQuery,
                    AND: {
                        ...selectParams,
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
            const { activityId, role } = ctx.session.user;

            const [items, count] = await Promise.all([
                prisma.goal.findMany({
                    take: limit + 1,
                    skip,
                    cursor: cursor ? { id: cursor } : undefined,
                    ...(query ? goalsFilter(query, activityId) : {}),
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
                    ...addCalclulatedGoalsFields(g, activityId, role),
                    _project: g.project ? addCalculatedProjectFields(g.project, activityId, role) : null,
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
        const { activityId, role } = ctx.session.user;

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
                        where: {
                            OR: [{ deleted: false }, { deleted: null }],
                        },
                    },
                },
            });

            if (!goal) return null;

            const history = await getGoalHistory(goal.history || []);

            return {
                ...goal,
                ...addCalclulatedGoalsFields(goal, activityId, role),
                _project: goal.project ? addCalculatedProjectFields(goal.project, activityId, role) : null,
                _activityFeed: mixHistoryWithComments(history, goal.comments),
                _relations: makeGoalRelationMap({
                    dependsOn: goal.dependsOn,
                    blocks: goal.blocks,
                    relatedTo: goal.relatedTo,
                }),
            };
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    create: protectedProcedure.input(goalCommonSchema).mutation(async ({ ctx, input }) => {
        if (!input.owner.id) return null;
        if (!input.parent.id) return null;

        const { activityId, role } = ctx.session.user;

        const actualProject = await prisma.project.findUnique({
            where: { id: input.parent.id },
            include: {
                activity: { include: { user: true, ghost: true } },
                participants: { include: { user: true, ghost: true } },
                watchers: { include: { user: true, ghost: true } },
            },
        });

        if (!actualProject) {
            return null;
        }

        try {
            const newGoal = await createGoal(input, activityId, role);
            await updateProjectUpdatedAt(actualProject.id);

            const recipients = Array.from(
                new Set(
                    [...actualProject.participants, ...actualProject.watchers, actualProject.activity]
                        .filter(Boolean)
                        .map((r) => r.user?.email),
                ),
            );

            await Promise.all([
                createEmailJob('goalCreated', {
                    to: recipients,
                    projectKey: actualProject.id,
                    projectTitle: actualProject.title,
                    shortId: newGoal._shortId,
                    title: newGoal.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                }),
                createEmailJob('goalAssigned', {
                    to: [newGoal.owner?.user?.email],
                    shortId: newGoal._shortId,
                    title: newGoal.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                }),
            ]);

            return newGoal;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    changeProject: protectedProcedure
        .input(goalChangeProjectSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ ctx, input }) => {
            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.id },
            });

            if (!actualGoal) return null;

            const { activityId, role } = ctx.session.user;

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
                await updateProjectUpdatedAt(goal.projectId);

                // TODO: goal was moved

                return {
                    ...goal,
                    ...addCalclulatedGoalsFields(goal, activityId, role),
                };
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    update: protectedProcedure
        .input(goalUpdateSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ ctx, input }) => {
            const { activityId, role } = ctx.session.user;
            const [estimate, estimateType] = input.estimate ? [new Date(input.estimate.date), input.estimate.type] : [];

            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.id },
                include: {
                    participants: { include: { user: true, ghost: true } },
                    watchers: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                    owner: { include: { user: true, ghost: true } },
                    project: true,
                    tags: true,
                    goalAsCriteria: true,
                },
            });

            if (!actualGoal) return null;

            const { _shortId } = addCalclulatedGoalsFields(actualGoal, activityId, role);

            const tagsToDisconnect = calculateDiffBetweenArrays(actualGoal.tags, input.tags);
            const tagsToConnect = calculateDiffBetweenArrays(input.tags, actualGoal.tags);

            const history: Omit<GoalHistory, 'id' | 'activityId' | 'goalId' | 'createdAt'>[] = [];
            const updatedFields: {
                title?: FieldDiff;
                description?: FieldDiff;
                estimate?: FieldDiff;
                priority?: FieldDiff;
            } = {};

            if (actualGoal.title !== input.title) {
                history.push({
                    subject: 'title',
                    action: 'change',
                    previousValue: actualGoal.title,
                    nextValue: input.title,
                });

                updatedFields.title = [actualGoal.title, input.title];
            }

            if (actualGoal.description !== input.description) {
                history.push({
                    subject: 'description',
                    action: 'change',
                    previousValue: actualGoal.description,
                    nextValue: input.description,
                });

                updatedFields.description = [actualGoal.description, input.description];
            }

            if (tagsToConnect.length || tagsToDisconnect.length) {
                const prevIds = actualGoal.tags.map(({ id }) => id).join(goalHistorySeparator);
                const nextIds = input.tags.map(({ id }) => id).join(goalHistorySeparator);

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

                updatedFields.priority = [actualGoal.priority, input.priority];
            }

            if (actualGoal.ownerId !== input.owner.id) {
                history.push({
                    subject: 'owner',
                    action: 'change',
                    previousValue: actualGoal.ownerId,
                    nextValue: input.owner.id,
                });
            }

            if (Number(estimate) !== Number(actualGoal.estimate) || estimateType !== actualGoal.estimateType) {
                const prevHistoryEstimate = actualGoal.estimate
                    ? encodeHistoryEstimate(actualGoal.estimate, actualGoal.estimateType ?? 'Strict')
                    : null;
                const nextHistoryEstimate = estimate ? encodeHistoryEstimate(estimate, estimateType ?? 'Strict') : null;

                history.push({
                    subject: 'estimate',
                    action: 'change',
                    previousValue: prevHistoryEstimate,
                    nextValue: nextHistoryEstimate,
                });

                const prevFormatedEstimate = actualGoal.estimate
                    ? formateEstimate(actualGoal.estimate, { locale: 'en', type: actualGoal.estimateType ?? 'Strict' })
                    : null;
                const nextFormatedEstimate = estimate
                    ? formateEstimate(estimate, { locale: 'en', type: estimateType ?? 'Strict' })
                    : null;

                // FIXME: https://github.com/taskany-inc/issues/issues/1359
                updatedFields.estimate = [prevFormatedEstimate, nextFormatedEstimate];
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
                        estimate,
                        estimateType,
                        tags: {
                            connect: tagsToConnect.map(({ id }) => ({ id })),
                            disconnect: tagsToDisconnect.map(({ id }) => ({ id })),
                        },
                        history: {
                            createMany: {
                                data: history.map((record) => ({ ...record, activityId })),
                            },
                        },
                        goalAsCriteria: actualGoal.goalAsCriteria
                            ? {
                                  update: {
                                      isDone: input.state.type === StateType.Completed,
                                  },
                              }
                            : undefined,
                    },
                    include: {
                        ...goalDeepQuery,
                        goalAsCriteria: true,
                    },
                });
                await updateProjectUpdatedAt(actualGoal?.projectId);

                if (goal.goalAsCriteria) {
                    await updateGoalWithCalculatedWeight(goal.goalAsCriteria.goalId);
                }

                const recipients = Array.from(
                    new Set(
                        [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner]
                            .filter(Boolean)
                            .map((r) => r.user?.email),
                    ),
                );

                await createEmailJob('goalUpdated', {
                    to: recipients,
                    shortId: _shortId,
                    title: actualGoal.title,
                    updatedFields,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                if (actualGoal.ownerId !== input.owner.id) {
                    await Promise.all([
                        createEmailJob('goalUnassigned', {
                            to: [actualGoal.owner?.user?.email],
                            shortId: _shortId,
                            title: actualGoal.title,
                            author: ctx.session.user.name || ctx.session.user.email,
                            authorEmail: ctx.session.user.email,
                        }),
                        createEmailJob('goalAssigned', {
                            to: [input.owner.user.email],
                            shortId: _shortId,
                            title: actualGoal.title,
                            author: ctx.session.user.name || ctx.session.user.email,
                            authorEmail: ctx.session.user.email,
                        }),
                    ]);
                }

                return {
                    ...goal,
                    ...addCalclulatedGoalsFields(goal, activityId, role),
                    _project: goal.project ? addCalculatedProjectFields(goal.project, activityId, role) : null,
                    _activityFeed: [],
                };
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
    toggleArchive: protectedProcedure
        .input(toggleGoalArchiveSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ input: { id, archived }, ctx }) => {
            const { activityId, role } = ctx.session.user;

            const actualGoal = await prisma.goal.findFirst({
                where: {
                    id,
                    ...nonArchievedGoalsPartialQuery,
                },
                include: {
                    participants: { include: { user: true, ghost: true } },
                    watchers: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                    owner: { include: { user: true, ghost: true } },
                    state: true,
                    project: true,
                },
            });

            if (!actualGoal) {
                return null;
            }

            const { _shortId } = addCalclulatedGoalsFields(actualGoal, activityId, role);

            try {
                const updatedGoal = await prisma.goal.update({
                    where: { id },
                    data: {
                        archived,
                        history: {
                            create: {
                                subject: 'state',
                                action: 'archive',
                                activityId,
                                nextValue: archived ? 'move to archive' : 'move from archive',
                            },
                        },
                    },
                });

                if (updatedGoal) {
                    await updateProjectUpdatedAt(updatedGoal.projectId);
                    await updateGoalWithCalculatedWeight(updatedGoal.id);
                }

                const recipients = Array.from(
                    new Set(
                        [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner]
                            .filter(Boolean)
                            .map((r) => r.user?.email),
                    ),
                );

                await createEmailJob('goalArchived', {
                    to: recipients,
                    shortId: _shortId,
                    title: actualGoal.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    switchState: protectedProcedure
        .input(goalStateChangeSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const { activityId, role } = ctx.session.user;

            const actualGoal = await prisma.goal.findFirst({
                where: {
                    id: input.id,
                    ...nonArchievedGoalsPartialQuery,
                },
                include: {
                    participants: { include: { user: true, ghost: true } },
                    watchers: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                    owner: { include: { user: true, ghost: true } },
                    state: true,
                    goalAsCriteria: true,
                    project: true,
                },
            });

            if (!actualGoal) {
                return null;
            }

            await updateProjectUpdatedAt(actualGoal.projectId);

            const { _shortId } = addCalclulatedGoalsFields(actualGoal, activityId, role);

            const promises: Promise<any>[] = [
                prisma.goal.update({
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
                                activityId,
                            },
                        },
                        goalAsCriteria: actualGoal.goalAsCriteria
                            ? {
                                  update: {
                                      isDone: input.state.type === StateType.Completed,
                                  },
                              }
                            : undefined,
                    },
                    include: {
                        goalAsCriteria: true,
                        state: true,
                    },
                }),
            ];

            // recording complete state for linked as criteria goal
            if (actualGoal.goalAsCriteria && actualGoal.state) {
                const earlyIsCompleted = actualGoal.state.type === StateType.Completed;
                const nowIsCompleted = input.state.type === StateType.Completed;

                if (earlyIsCompleted !== nowIsCompleted) {
                    promises.push(
                        prisma.goalHistory.create({
                            data: {
                                goalId: actualGoal.goalAsCriteria.goalId,
                                subject: 'criteria',
                                action: nowIsCompleted ? 'complete' : 'uncomplete',
                                nextValue: actualGoal.goalAsCriteria.id,
                                activityId,
                            },
                        }),
                    );
                }
            }

            try {
                const [updatedGoal] = await Promise.all(promises);

                if (updatedGoal.goalAsCriteria) {
                    await updateGoalWithCalculatedWeight(updatedGoal.goalAsCriteria.goalId);
                }

                const recipients = Array.from(
                    new Set(
                        [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner]
                            .filter(Boolean)
                            .map((r) => r.user?.email),
                    ),
                );

                await createEmailJob('goalStateUpdated', {
                    to: recipients,
                    shortId: _shortId,
                    stateTitleBefore: actualGoal.state?.title,
                    stateTitleAfter: updatedGoal.state?.title,
                    title: actualGoal.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    createComment: protectedProcedure.input(goalCommentCreateSchema).mutation(async ({ ctx, input }) => {
        if (!input.goalId) return null;

        const { activityId, role } = ctx.session.user;

        const [commentAuthor, actualGoal, pushState] = await Promise.all([
            prisma.activity.findUnique({
                where: { id: ctx.session.user.activityId },
                include: { user: true, ghost: true },
            }),
            prisma.goal.findUnique({
                where: { id: input.goalId },
                include: {
                    participants: { include: { user: true, ghost: true } },
                    watchers: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                    owner: { include: { user: true, ghost: true } },
                    state: true,
                    project: true,
                    goalAsCriteria: true,
                },
            }),
            input.stateId ? prisma.state.findUnique({ where: { id: input.stateId } }) : Promise.resolve(undefined),
        ]);

        if (!commentAuthor) return null;
        if (!actualGoal) return null;

        const { _isEditable, _shortId } = addCalclulatedGoalsFields(actualGoal, activityId, role);

        try {
            // We want to see state changes record and comment next in activity feed.
            const [updatedGoal, newComment] = await prisma.$transaction([
                // Update goal and push to history first.
                prisma.goal.update({
                    where: { id: input.goalId },
                    data: {
                        id: input.goalId,
                        stateId: _isEditable ? pushState?.id : actualGoal.stateId,
                        goalAsCriteria: actualGoal.goalAsCriteria
                            ? {
                                  update: {
                                      isDone: _isEditable && pushState?.type && pushState?.type === StateType.Completed,
                                  },
                              }
                            : undefined,
                        history:
                            _isEditable && input.stateId && input.stateId !== actualGoal.stateId
                                ? {
                                      create: {
                                          subject: 'state',
                                          action: 'change',
                                          previousValue: actualGoal.stateId,
                                          nextValue: input.stateId,
                                          activityId,
                                      },
                                  }
                                : undefined,
                        // subscribe comment author
                        watchers: {
                            connect: [{ id: commentAuthor.id }],
                        },
                    },
                    include: {
                        goalAsCriteria: true,
                        state: true,
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
                    include: {
                        activity: {
                            include: {
                                user: true,
                            },
                        },
                    },
                }),
            ]);
            await updateProjectUpdatedAt(updatedGoal.projectId);

            if (updatedGoal.goalAsCriteria) {
                await updateGoalWithCalculatedWeight(updatedGoal.goalAsCriteria.goalId);
            }

            const recipients = Array.from(
                new Set(
                    [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner]
                        .filter(Boolean)
                        .map((r) => r.user?.email),
                ),
            );

            if (input.stateId) {
                await createEmailJob('goalStateUpdatedWithComment', {
                    to: recipients,
                    shortId: _shortId,
                    stateTitleBefore: actualGoal.state?.title,
                    stateTitleAfter: updatedGoal.state?.title,
                    title: actualGoal.title,
                    commentId: newComment.id,
                    author: newComment.activity.user?.name || newComment.activity.user?.email,
                    authorEmail: ctx.session.user.email,
                    body: newComment.description,
                });
            } else {
                await createEmailJob('goalCommented', {
                    to: recipients,
                    shortId: _shortId,
                    title: actualGoal.title,
                    commentId: newComment.id,
                    author: newComment.activity.user?.name || newComment.activity.user?.email,
                    authorEmail: ctx.session.user.email,
                    body: newComment.description,
                });
            }

            return newComment;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    updateComment: protectedProcedure
        .input(commentEditSchema)
        .use(commentAccessMiddleware)
        .mutation(async ({ input: { id, description } }) => {
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
    deleteComment: protectedProcedure
        .input(z.string())
        .use(commentAccessMiddleware)
        .mutation(async ({ input: id }) => {
            try {
                const deletedComment = await prisma.comment.delete({
                    where: {
                        id,
                    },
                });

                const actualGoal = await prisma.goal.findUnique({ where: { id: deletedComment.goalId } });
                await updateProjectUpdatedAt(actualGoal?.projectId);

                return deletedComment;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    addCriteria: protectedProcedure
        .input(criteriaSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.goalId },
            });

            if (!actualGoal) {
                return null;
            }

            let isDoneByConnect = false;

            if (input.goalAsGriteria?.id) {
                const connectedGoal = await prisma.goal.findUnique({
                    where: { id: input.goalAsGriteria.id },
                    include: { state: true },
                });

                isDoneByConnect = connectedGoal?.state?.type === StateType.Completed;
            }

            try {
                const newCriteria = await prisma.goalAchieveCriteria.create({
                    data: {
                        title: input.title,
                        weight: Number(input.weight),
                        isDone: isDoneByConnect,
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
                });

                await prisma.goalHistory.create({
                    data: {
                        previousValue: null,
                        nextValue: newCriteria.id,
                        action: 'add',
                        subject: 'criteria',
                        goal: {
                            connect: {
                                id: input.goalId,
                            },
                        },
                        activity: {
                            connect: {
                                id: ctx.session.user.activityId,
                            },
                        },
                    },
                });

                await updateGoalWithCalculatedWeight(newCriteria.goalId);
                await updateProjectUpdatedAt(actualGoal.projectId);

                return newCriteria;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    updateCriteria: protectedProcedure
        .input(updateCriteriaSchema)
        .use(criteriaAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const currentCriteria = await prisma.goalAchieveCriteria.findUnique({
                where: { id: input.id },
            });

            try {
                if (!currentCriteria) {
                    throw Error('No current criteria');
                }

                let isDoneByConnect: boolean | null = null;

                if (input.goalAsGriteria?.id) {
                    const connectedGoal = await prisma.goal.findUnique({
                        where: { id: input.goalAsGriteria.id },
                        include: { state: true },
                    });

                    isDoneByConnect = connectedGoal?.state?.type === StateType.Completed;
                }

                const updatedCriteria = await prisma.goalAchieveCriteria.create({
                    data: {
                        title: input.title,
                        weight: Number(input.weight),
                        isDone: isDoneByConnect == null ? currentCriteria.isDone : isDoneByConnect,
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
                        createdAt: currentCriteria.createdAt,
                    },
                });

                const [, , actualGoal] = await Promise.all([
                    prisma.goalAchieveCriteria.update({
                        where: { id: currentCriteria.id },
                        data: {
                            deleted: true,
                        },
                    }),
                    prisma.goalHistory.create({
                        data: {
                            previousValue: currentCriteria.id,
                            nextValue: updatedCriteria.id,
                            action: 'change',
                            subject: 'criteria',
                            goal: {
                                connect: {
                                    id: input.goalId,
                                },
                            },
                            activity: {
                                connect: {
                                    id: ctx.session.user.activityId,
                                },
                            },
                        },
                    }),
                    prisma.goal.findUnique({ where: { id: input.goalId } }),
                ]);

                await updateProjectUpdatedAt(actualGoal?.projectId);

                if (updatedCriteria) {
                    await updateGoalWithCalculatedWeight(updatedCriteria.goalId);
                }
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    updateCriteriaState: protectedProcedure
        .input(updateCriteriaState)
        .use(criteriaAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const currentCriteria = await prisma.goalAchieveCriteria.findUnique({
                where: { id: input.id },
            });

            try {
                if (!currentCriteria) {
                    throw Error('No current criteria');
                }

                const [, , actualGoal] = await Promise.all([
                    prisma.goalAchieveCriteria.update({
                        where: { id: input.id },
                        data: { isDone: input.isDone },
                    }),
                    prisma.goalHistory.create({
                        data: {
                            nextValue: currentCriteria.id,
                            subject: 'criteria',
                            action: input.isDone ? 'complete' : 'uncomplete',
                            goal: {
                                connect: { id: currentCriteria.goalId },
                            },
                            activity: {
                                connect: { id: ctx.session.user.activityId },
                            },
                        },
                    }),
                    prisma.goal.findUnique({ where: { id: currentCriteria.goalId } }),
                ]);

                await updateProjectUpdatedAt(actualGoal?.projectId);

                // update goal criteria weight
                await updateGoalWithCalculatedWeight(currentCriteria.goalId);
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    removeCriteria: protectedProcedure
        .input(removeCriteria)
        .use(criteriaAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const current = await prisma.goalAchieveCriteria.findUnique({
                where: { id: input.id },
            });

            try {
                if (current) {
                    const [, , actualGoal] = await Promise.all([
                        prisma.goalAchieveCriteria.update({
                            where: { id: input.id },
                            data: {
                                deleted: true,
                            },
                        }),
                        prisma.goalHistory.create({
                            data: {
                                nextValue: current.id,
                                subject: 'criteria',
                                action: 'remove',
                                activity: {
                                    connect: { id: ctx.session.user.activityId },
                                },
                                goal: {
                                    connect: { id: input.goalId },
                                },
                            },
                        }),
                        prisma.goal.findUnique({ where: { id: input.goalId } }),
                    ]);

                    await updateGoalWithCalculatedWeight(current.goalId);
                    await updateProjectUpdatedAt(actualGoal?.projectId);
                }
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    convertCriteriaToGoal: protectedProcedure
        .input(convertCriteriaToGoalSchema)
        .use(criteriaAccessMiddleware)
        .mutation(async ({ input }) => {
            try {
                const actualCriteria = await prisma.goalAchieveCriteria.findUnique({
                    where: { id: input.id },
                });

                if (!actualCriteria) {
                    return null;
                }

                const [, actualGoal] = await Promise.all([
                    prisma.goalAchieveCriteria.update({
                        where: { id: input.id },
                        data: {
                            title: input.title,
                            goalAsCriteria: {
                                connect: { id: input.goalAsCriteria.id },
                            },
                        },
                    }),
                    prisma.goal.findUnique({ where: { id: actualCriteria.goalId } }),
                ]);
                await updateProjectUpdatedAt(actualGoal?.projectId);
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    addParticipant: protectedProcedure
        .input(toggleParticipantsSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            try {
                const updatedGoal = await prisma.goal.update({
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

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    removeParticipant: protectedProcedure
        .input(toggleParticipantsSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            try {
                const updatedGoal = await prisma.goal.update({
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

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    addDependency: protectedProcedure
        .input(toggleGoalDependencySchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            try {
                const updatedGoal = await prisma.goal.update({
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

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    removeDependency: protectedProcedure
        .input(toggleGoalDependencySchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            try {
                const updatedGoal = await prisma.goal.update({
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

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    getListByProjectId: protectedProcedure.input(batchGoalByProjectIdSchema).query(async ({ input }) => {
        try {
            return prisma.goal.findMany({
                where: {
                    projectId: input.projectId,
                    ...nonArchievedGoalsPartialQuery,
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    updateTag: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                tags: z.array(
                    z.object({
                        id: z.string(),
                        title: z.string(),
                    }),
                ),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.id },
                include: { tags: true },
            });

            if (!actualGoal) return null;

            const tagsToDisconnect = calculateDiffBetweenArrays(actualGoal.tags, input.tags);
            const tagsToConnect = calculateDiffBetweenArrays(input.tags, actualGoal.tags);

            if (!tagsToConnect.length && !tagsToDisconnect.length) return null;

            const prevIds = actualGoal.tags.map(({ id }) => id).join(goalHistorySeparator);
            const nextIds = input.tags.map(({ id }) => id).join(goalHistorySeparator);

            const history = {
                subject: 'tags',
                action: 'change',
                previousValue: prevIds.length ? prevIds : null,
                nextValue: nextIds.length ? nextIds : null,
                activityId: ctx.session.user.activityId,
            };

            try {
                const updatedGoal = await prisma.goal.update({
                    where: { id: input.id },
                    data: {
                        tags: {
                            connect: tagsToConnect.map(({ id }) => ({ id })),
                            disconnect: tagsToDisconnect.map(({ id }) => ({ id })),
                        },
                        history: {
                            create: history,
                        },
                    },
                });

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: String(error.message),
                    cause: error,
                });
            }
        }),
    updateOwner: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                ownerId: z.string(),
            }),
        )
        .use(goalAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.id },
            });

            if (!actualGoal) return null;
            if (actualGoal.ownerId === input.ownerId) return null;

            const history = {
                subject: 'owner',
                action: 'change',
                previousValue: actualGoal.ownerId,
                nextValue: input.ownerId,
                activityId: ctx.session.user.activityId,
            };

            try {
                const updatedGoal = await prisma.goal.update({
                    where: { id: input.id },
                    data: {
                        ownerId: input.ownerId,
                        history: {
                            create: history,
                        },
                    },
                });

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: String(error.message),
                    cause: error,
                });
            }
        }),
});
