import z from 'zod';
import { TRPCError } from '@trpc/server';
import { GoalHistory, Prisma, StateType } from '@prisma/client';

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
    makeGoalRelationMap,
    updateGoalWithCalculatedWeight,
} from '../../src/utils/db';
import { createEmailJob } from '../../src/utils/worker/create';
import { calculateDiffBetweenArrays } from '../../src/utils/calculateDiffBetweenArrays';
import {
    convertCriteriaToGoalSchema,
    criteriaSchema,
    removeCriteria,
    updateCriteriaState,
} from '../../src/schema/criteria';
import type { FieldDiff } from '../../src/types/common';

import { addCalculatedProjectFields } from './project';

export const goal = router({
    suggestions: protectedProcedure.input(suggestionsQueryScheme).query(async ({ input }) => {
        const splittedInput = input.input.split('-');
        let selectParams: Prisma.GoalFindManyArgs['where'] = {
            title: {
                contains: input.input,
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
            take: input.limit || 5,
            where: {
                AND: {
                    ...selectParams,
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
                        where: {
                            OR: [{ deleted: false }, { deleted: null }],
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
                relations: makeGoalRelationMap({
                    dependsOn: goal.dependsOn,
                    blocks: goal.blocks,
                    relatedTo: goal.relatedTo,
                }),
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
            const newGoal = await createGoal(activityId, input);

            const recipients = Array.from(
                new Set(
                    [...actualProject.participants, ...actualProject.watchers, actualProject.activity]
                        .filter(Boolean)
                        .filter((p) => p.user?.email !== ctx.session.user.email)
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
                }),
                createEmailJob('goalAssigned', {
                    to: [newGoal.owner?.user?.email],
                    shortId: newGoal._shortId,
                    title: newGoal.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                }),
            ]);

            return newGoal;
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

            // TODO: goal was moved

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
                participants: { include: { user: true, ghost: true } },
                watchers: { include: { user: true, ghost: true } },
                activity: { include: { user: true, ghost: true } },
                owner: { include: { user: true, ghost: true } },
                project: true,
                tags: true,
                estimate: {
                    include: { estimate: true },
                },
                goalAsCriteria: true,
            },
        });

        if (!actualGoal) return null;

        const { _isEditable, _shortId } = addCalclulatedGoalsFields(actualGoal, ctx.session.user.activityId);

        if (!_isEditable) {
            return null;
        }

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

            // TODO: estimate diff
            // updatedFields.estimate = [];
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

            if (goal.goalAsCriteria) {
                await updateGoalWithCalculatedWeight(goal.goalAsCriteria.goalId);
            }

            const recipients = Array.from(
                new Set(
                    [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner]
                        .filter(Boolean)
                        .filter((p) => p.user?.email !== ctx.session.user.email)
                        .map((r) => r.user?.email),
                ),
            );

            await createEmailJob('goalUpdated', {
                to: recipients,
                shortId: _shortId,
                title: actualGoal.title,
                updatedFields,
                author: ctx.session.user.name || ctx.session.user.email,
            });

            if (actualGoal.ownerId !== input.owner.id) {
                await Promise.all([
                    createEmailJob('goalUnassigned', {
                        to: [actualGoal.owner?.user?.email],
                        shortId: _shortId,
                        title: actualGoal.title,
                        author: ctx.session.user.name || ctx.session.user.email,
                    }),
                    createEmailJob('goalAssigned', {
                        to: [input.owner.user.email],
                        shortId: _shortId,
                        title: actualGoal.title,
                        author: ctx.session.user.name || ctx.session.user.email,
                    }),
                ]);
            }

            return {
                ...goal,
                ...addCalclulatedGoalsFields(goal, ctx.session.user.activityId),
                project: goal.project ? addCalculatedProjectFields(goal.project, ctx.session.user.activityId) : null,
                estimate: getEstimateListFormJoin(goal),
                activityFeed: [],
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
        .mutation(async ({ input: { id, archived }, ctx }) => {
            const actualGoal = await prisma.goal.findFirst({
                where: {
                    id,
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

            const { _isEditable, _shortId } = addCalclulatedGoalsFields(actualGoal, ctx.session.user.activityId);

            if (!_isEditable) {
                return null;
            }

            try {
                const updatedGoal = prisma.goal.update({
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

                const recipients = Array.from(
                    new Set(
                        [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner]
                            .filter(Boolean)
                            .filter((p) => p.user?.email !== ctx.session.user.email)
                            .map((r) => r.user?.email),
                    ),
                );

                await createEmailJob('goalArchived', {
                    to: recipients,
                    shortId: _shortId,
                    title: actualGoal.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                });

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    switchState: protectedProcedure.input(goalStateChangeSchema).mutation(async ({ input, ctx }) => {
        const actualGoal = await prisma.goal.findFirst({
            where: {
                id: input.id,
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

        const { _isEditable, _shortId } = addCalclulatedGoalsFields(actualGoal, ctx.session.user.activityId);

        if (!_isEditable) {
            return null;
        }

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
                            activityId: ctx.session.user.activityId,
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
                            activityId: ctx.session.user.activityId,
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
                        .filter((p) => p.user?.email !== ctx.session.user.email)
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
            });

            return updatedGoal;
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
                    watchers: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                    owner: { include: { user: true, ghost: true } },
                    state: true,
                    project: true,
                    goalAsCriteria: true,
                },
            }),
        ]);

        if (!commentAuthor) return null;
        if (!actualGoal) return null;

        const { _isEditable, _shortId } = addCalclulatedGoalsFields(actualGoal, ctx.session.user.activityId);

        try {
            // We want to see state changes record and comment next in activity feed.
            const [updatedGoal, newComment] = await prisma.$transaction([
                // Update goal and push to history first.
                prisma.goal.update({
                    where: { id: input.goalId },
                    data: {
                        id: input.goalId,
                        stateId: _isEditable ? input.stateId : actualGoal.stateId,
                        goalAsCriteria: actualGoal.goalAsCriteria
                            ? {
                                  update: {
                                      isDone: _isEditable && input.stateType && input.stateType === StateType.Completed,
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
                                          activityId: ctx.session.user.activityId,
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

            if (updatedGoal.goalAsCriteria) {
                await updateGoalWithCalculatedWeight(updatedGoal.goalAsCriteria.goalId);
            }

            const recipients = Array.from(
                new Set(
                    [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner]
                        .filter(Boolean)
                        .filter((p) => p.user?.email !== commentAuthor?.user?.email)
                        .map((r) => r.user?.email),
                ),
            );

            if (recipients.length) {
                if (input.stateId) {
                    await createEmailJob('goalStateUpdatedWithComment', {
                        to: recipients,
                        shortId: _shortId,
                        stateTitleBefore: actualGoal.state?.title,
                        stateTitleAfter: updatedGoal.state?.title,
                        title: actualGoal.title,
                        commentId: newComment.id,
                        author: newComment.activity.user?.name || newComment.activity.user?.email,
                        body: newComment.description,
                    });
                } else {
                    await createEmailJob('goalCommented', {
                        to: recipients,
                        shortId: _shortId,
                        title: actualGoal.title,
                        commentId: newComment.id,
                        author: newComment.activity.user?.name || newComment.activity.user?.email,
                        body: newComment.description,
                    });
                }
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

            return newCriteria;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    updateCriteriaState: protectedProcedure.input(updateCriteriaState).mutation(async ({ input, ctx }) => {
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
            ]);

            // update goal criteria weight
            await updateGoalWithCalculatedWeight(currentCriteria.goalId);
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    removeCriteria: protectedProcedure.input(removeCriteria).mutation(async ({ input, ctx }) => {
        const current = await prisma.goalAchieveCriteria.findUnique({
            where: { id: input.id },
        });

        try {
            if (current) {
                await prisma.goalAchieveCriteria.update({
                    where: { id: input.id },
                    data: {
                        deleted: true,
                    },
                });

                await prisma.goalHistory.create({
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
                });

                await updateGoalWithCalculatedWeight(current.goalId);
            }
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    convertCriteriaToGoal: protectedProcedure.input(convertCriteriaToGoalSchema).mutation(async ({ input, ctx }) => {
        try {
            const actualCriteria = await prisma.goalAchieveCriteria.findUnique({
                where: { id: input.id },
            });

            if (!actualCriteria) {
                return null;
            }

            await prisma.goalAchieveCriteria.update({
                where: { id: input.id },
                data: {
                    title: input.title,
                    goalAsCriteria: {
                        connect: { id: input.goalAsCriteria.id },
                    },
                },
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
