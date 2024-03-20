import z from 'zod';
import { TRPCError } from '@trpc/server';
import { GoalHistory, Prisma, StateType } from '@prisma/client';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { getGoalDeepQuery, goalsFilter, nonArchievedGoalsPartialQuery } from '../queries/goals';
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
    togglePartnerProjectSchema,
} from '../../src/schema/goal';
import { ToggleSubscriptionSchema, suggestionsQuerySchema, batchGoalsSchema } from '../../src/schema/common';
import { connectionMap } from '../queries/connections';
import {
    createGoal,
    changeGoalProject,
    getGoalHistory,
    mixHistoryWithComments,
    makeGoalRelationMap,
    goalHistorySeparator,
    createPersonalProject,
    clearEmptyPersonalProject,
    countPrivateDependencies,
} from '../../src/utils/db';
import { createEmail } from '../../src/utils/createEmail';
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
import {
    goalEditAccessMiddleware,
    commentAccessMiddleware,
    criteriaAccessMiddleware,
    goalAccessMiddleware,
    goalByShortIdAccessMiddleware,
    goalParticipantEditAccessMiddleware,
} from '../access/accessMiddlewares';
import { addCalculatedProjectFields, nonArchivedPartialQuery } from '../queries/project';
import { recalculateCriteriaScore, goalIncludeCriteriaParams } from '../../src/utils/recalculateCriteriaScore';
import { getProjectAccessFilter, goalAchiveCriteriaFilter } from '../queries/access';
import { prepareRecipients } from '../../src/utils/prepareRecipients';
import { updateProjectUpdatedAt } from '../../src/utils/db/updateProjectUpdatedAt';
import { addCalculatedGoalsFields } from '../../src/utils/db/calculatedGoalsFields';
import { createComment } from '../../src/utils/db/createComment';
import { getShortId } from '../../src/utils/getShortId';

export const goal = router({
    suggestions: protectedProcedure
        .input(suggestionsQuerySchema)
        .query(async ({ ctx, input: { input, limit = 5, onlyCurrentUser = false } }) => {
            const { activityId, role } = ctx.session.user || {};

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

            if (role === 'USER' && onlyCurrentUser) {
                selectParams = {
                    ...selectParams,
                    AND: {
                        OR: [{ ownerId: activityId }, { activityId }],
                    },
                };
            }

            const data = await prisma.goal.findMany({
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
                where: {
                    activityId: input.length ? { contains: '' } : activityId,
                    ...nonArchievedGoalsPartialQuery,
                    AND: {
                        ...selectParams,
                        project: {
                            ...getProjectAccessFilter(activityId, role),
                        },
                    },
                },
                include: getGoalDeepQuery({
                    activityId,
                    role,
                }),
            });

            const checkEnableGoalByProjectOwner = (goal: (typeof data)[number]) => {
                const { _isEditable } = addCalculatedGoalsFields(goal, activityId, role);

                return _isEditable;
            };

            if (onlyCurrentUser) {
                return data.filter(checkEnableGoalByProjectOwner);
            }

            return data;
        }),
    getGoalsCount: protectedProcedure
        .input(batchGoalsSchema.pick({ query: true, baseQuery: true }))
        .query(async ({ input, ctx }) => {
            const { query, baseQuery = {} } = input;
            const { activityId, role } = ctx.session.user;
            const projectAccessFilter = getProjectAccessFilter(activityId, role);
            const baseWhere = {
                ...nonArchivedPartialQuery,
                ...goalsFilter(baseQuery, activityId, role).where,
                project: {
                    ...projectAccessFilter,
                },
            };

            const [count, filtered] = await Promise.all([
                prisma.goal.count({
                    where: baseWhere,
                }),
                prisma.goal.count({
                    where: query ? goalsFilter(query, activityId, role).where : baseWhere,
                }),
            ]);
            return {
                count,
                filtered,
            };
        }),
    getBatch: protectedProcedure
        .input(batchGoalsSchema)
        .query(async ({ ctx, input: { query, limit, skip, cursor } }) => {
            const { activityId, role } = ctx.session.user;

            const [items, count] = await Promise.all([
                prisma.goal.findMany({
                    take: limit + 1,
                    skip,
                    cursor: cursor ? { id: cursor } : undefined,
                    ...(query ? goalsFilter(query, activityId, role) : {}),
                    orderBy: {
                        id: 'asc',
                    },
                    include: getGoalDeepQuery({
                        activityId,
                        role,
                    }),
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
                    ...addCalculatedGoalsFields(g, activityId, role),
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
    getById: protectedProcedure
        .input(z.string())
        .use(goalByShortIdAccessMiddleware)
        .query(async ({ ctx, input }) => {
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
                        ...getGoalDeepQuery({
                            activityId,
                            role,
                        }),
                        goalAchiveCriteria: {
                            include: {
                                criteriaGoal: {
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
                                AND: goalAchiveCriteriaFilter(activityId, role),
                                OR: [{ deleted: false }, { deleted: null }],
                            },
                        },
                    },
                });

                if (!goal) return null;

                const history = await getGoalHistory(goal.history || []);

                const [versaCriteriaGoals, privateDepsCount] = await Promise.all([
                    prisma.goalAchieveCriteria.findMany({
                        where: {
                            AND: {
                                criteriaGoalId: goal.id,
                                OR: [{ deleted: false }, { deleted: null }],
                                AND: {
                                    OR: [
                                        {
                                            goal: {
                                                project: {
                                                    ...getProjectAccessFilter(activityId, role),
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        include: {
                            goal: {
                                include: {
                                    state: true,
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
                                },
                            },
                        },
                    }),
                    await countPrivateDependencies({
                        projectId,
                        scopeId,
                    }),
                ]);

                const _hasPrivateDeps = Boolean(
                    privateDepsCount.blocks ||
                        privateDepsCount.dependsOn ||
                        privateDepsCount.relatedTo ||
                        privateDepsCount.goalAchiveCriteria,
                );

                return {
                    ...goal,
                    ...addCalculatedGoalsFields(goal, activityId, role),
                    ...mixHistoryWithComments(history, goal.comments),
                    _hasPrivateDeps,
                    _project: goal.project ? addCalculatedProjectFields(goal.project, activityId, role) : null,
                    _relations: makeGoalRelationMap(
                        {
                            dependsOn: goal.dependsOn,
                            blocks: goal.blocks,
                            relatedTo: goal.relatedTo,
                            connected: goal.connected,
                        },
                        activityId,
                        role,
                    ),
                    _versaCriteria: versaCriteriaGoals.map(({ goal, ...rest }) => ({
                        ...rest,
                        goal: {
                            ...goal,
                            _shortId: getShortId(goal),
                        },
                    })),

                    _criteria: goal.goalAchiveCriteria.map(({ criteriaGoal, ...criteria }) => ({
                        ...criteria,
                        criteriaGoal:
                            criteriaGoal != null
                                ? {
                                      ...criteriaGoal,
                                      _shortId: getShortId(criteriaGoal),
                                  }
                                : null,
                    })),
                };
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    create: protectedProcedure.input(goalCommonSchema).mutation(async ({ ctx, input }) => {
        if (!input.owner.id) return null;

        const { activityId, role } = ctx.session.user;

        const actualProject = input.parent
            ? await prisma.project.findUnique({
                  where: { id: input.parent.id },
                  include: {
                      activity: { include: { user: true, ghost: true } },
                      participants: { include: { user: true, ghost: true } },
                      watchers: { include: { user: true, ghost: true } },
                  },
              })
            : await createPersonalProject({
                  ownerId: input.owner.id,
                  activityId,
                  role,
              });

        if (!actualProject) {
            return null;
        }

        try {
            const newGoal = await createGoal(input, actualProject.id, activityId, role);
            await updateProjectUpdatedAt(actualProject.id);

            const recipients = prepareRecipients([
                ...actualProject.participants,
                ...actualProject.watchers,
                actualProject.activity,
            ]);

            await Promise.all([
                createEmail('goalCreated', {
                    to: recipients,
                    projectKey: actualProject.id,
                    projectTitle: actualProject.title,
                    shortId: newGoal._shortId,
                    title: newGoal.title,
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                }),
                createEmail('goalAssigned', {
                    to: prepareRecipients([newGoal.owner]),
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
        .use(goalEditAccessMiddleware)
        .mutation(async ({ ctx, input }) => {
            const [actualGoal, actualProject] = await Promise.all([
                prisma.goal.findUnique({
                    where: { id: input.id },
                    include: {
                        participants: { include: { user: true, ghost: true } },
                    },
                }),
                prisma.project.findUnique({
                    where: {
                        id: input.projectId,
                    },
                }),
            ]);

            if (!actualGoal || !actualProject || actualProject.personal) return null;

            const { activityId, role } = ctx.session.user;

            try {
                await changeGoalProject(input.id, input.projectId);
                await updateProjectUpdatedAt(actualGoal?.projectId);
                await clearEmptyPersonalProject(actualGoal?.projectId);

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
                        ...getGoalDeepQuery({
                            activityId,
                            role,
                        }),
                        goalInCriteria: goalIncludeCriteriaParams,
                    },
                });

                await updateProjectUpdatedAt(goal.projectId);

                await recalculateCriteriaScore(goal.id).recalcLinkedGoalsScores().recalcAverageProjectScore().run();

                // TODO: goal was moved

                return {
                    ...goal,
                    ...addCalculatedGoalsFields(goal, activityId, role),
                };
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    update: protectedProcedure
        .input(goalUpdateSchema)
        .use(goalEditAccessMiddleware)
        .mutation(async ({ ctx, input }) => {
            const { activityId, role } = ctx.session.user;
            const [estimate = null, estimateType = null] = input.estimate
                ? [new Date(input.estimate.date), input.estimate.type]
                : [];

            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.id },
                include: {
                    project: true,
                    participants: { include: { user: true, ghost: true } },
                    watchers: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                    owner: { include: { user: true, ghost: true } },
                    tags: true,
                    goalInCriteria: true,
                    priority: true,
                },
            });

            if (!actualGoal) return null;

            const { _shortId } = addCalculatedGoalsFields(actualGoal, activityId, role);

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

            if (actualGoal.priority?.id !== input.priority.id) {
                history.push({
                    subject: 'priority',
                    action: 'change',
                    previousValue: actualGoal.priority?.id || null,
                    nextValue: input.priority.id,
                });

                updatedFields.priority = [actualGoal.priority?.title, input.priority.title];
            }

            if (actualGoal.ownerId !== input.owner.id) {
                history.push({
                    subject: 'owner',
                    action: 'change',
                    previousValue: actualGoal.ownerId,
                    nextValue: input.owner.id,
                });
            }

            const isDateChanged = (Number(estimate) || 0) !== (Number(actualGoal.estimate) || 0);
            const isTypeChanged = estimateType !== actualGoal.estimateType;

            if (isDateChanged || isTypeChanged) {
                const prevHistoryEstimate = actualGoal.estimate
                    ? encodeHistoryEstimate(actualGoal.estimate, actualGoal.estimateType ?? 'Strict')
                    : null;
                const nextHistoryEstimate = estimate ? encodeHistoryEstimate(estimate, estimateType ?? 'Strict') : null;

                history.push({
                    subject: 'estimate',
                    action: nextHistoryEstimate ? 'change' : 'remove',
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

            const personalGoalOwnerChanged = actualGoal.ownerId !== input.owner.id && actualGoal.project?.personal;

            if (personalGoalOwnerChanged) {
                const newParent = await createPersonalProject({
                    ownerId: input.owner.id,
                    activityId,
                    role,
                });
                await changeGoalProject(actualGoal.id, newParent.id);
                await updateProjectUpdatedAt(newParent.id);
            }

            try {
                const goal = await prisma.goal.update({
                    where: { id: actualGoal.id },
                    data: {
                        ownerId: input.owner?.id,
                        title: input.title,
                        description: input.description,
                        stateId: input.state?.id,
                        priorityId: input.priority.id,
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
                        participants: personalGoalOwnerChanged
                            ? {
                                  set: [{ id: input.owner.id }, { id: activityId }],
                              }
                            : {},
                        goalInCriteria: {
                            updateMany: {
                                where: {
                                    id: { in: actualGoal.goalInCriteria.map(({ id }) => id) },
                                },
                                data: {
                                    isDone: input.state.type === StateType.Completed,
                                },
                            },
                        },
                    },
                    include: {
                        ...getGoalDeepQuery({
                            activityId,
                            role,
                        }),
                        goalInCriteria: goalIncludeCriteriaParams,
                    },
                });

                await updateProjectUpdatedAt(actualGoal?.projectId);

                if (personalGoalOwnerChanged) {
                    await clearEmptyPersonalProject(actualGoal.projectId);
                }

                if (actualGoal.stateId !== goal.stateId) {
                    await recalculateCriteriaScore(goal.id).recalcLinkedGoalsScores().recalcAverageProjectScore().run();
                }

                const recipients = prepareRecipients([
                    ...actualGoal.participants,
                    ...actualGoal.watchers,
                    actualGoal.activity,
                    actualGoal.owner,
                ]);

                if (Object.keys(updatedFields).length) {
                    await createEmail('goalUpdated', {
                        to: recipients,
                        shortId: _shortId,
                        title: actualGoal.title,
                        updatedFields,
                        author: ctx.session.user.name || ctx.session.user.email,
                        authorEmail: ctx.session.user.email,
                    });
                }

                if (actualGoal.ownerId !== input.owner.id) {
                    await Promise.all([
                        createEmail('goalUnassigned', {
                            to: prepareRecipients([actualGoal.owner]),
                            shortId: _shortId,
                            title: actualGoal.title,
                            author: ctx.session.user.name || ctx.session.user.email,
                            authorEmail: ctx.session.user.email,
                        }),
                        createEmail('goalAssigned', {
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
                    ...addCalculatedGoalsFields(goal, activityId, role),
                    _project: goal.project ? addCalculatedProjectFields(goal.project, activityId, role) : null,
                    _activityFeed: [],
                };
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    toggleStargizer: protectedProcedure
        .input(ToggleSubscriptionSchema)
        .use(goalAccessMiddleware)
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
    toggleWatcher: protectedProcedure
        .input(ToggleSubscriptionSchema)
        .use(goalAccessMiddleware)
        .mutation(({ ctx, input: { id, direction } }) => {
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
        .use(goalEditAccessMiddleware)
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

            const { _shortId } = addCalculatedGoalsFields(actualGoal, activityId, role);

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
                    include: {
                        state: true,
                        goalInCriteria: goalIncludeCriteriaParams,
                    },
                });

                if (updatedGoal) {
                    await recalculateCriteriaScore(updatedGoal.id)
                        .recalcLinkedGoalsScores()
                        .recalcAverageProjectScore()
                        .run();
                }

                const recipients = prepareRecipients([
                    ...actualGoal.participants,
                    ...actualGoal.watchers,
                    actualGoal.activity,
                    actualGoal.owner,
                ]);

                await createEmail('goalArchived', {
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
        .use(goalEditAccessMiddleware)
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
                    goalInCriteria: true,
                    project: true,
                },
            });

            if (!actualGoal) {
                return null;
            }

            await updateProjectUpdatedAt(actualGoal.projectId);

            const { _shortId } = addCalculatedGoalsFields(actualGoal, activityId, role);

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
                        goalInCriteria: {
                            updateMany: {
                                where: {
                                    id: { in: actualGoal.goalInCriteria.map(({ id }) => id) },
                                },
                                data: { isDone: input.state.type === StateType.Completed },
                            },
                        },
                    },
                    include: {
                        state: true,
                        goalInCriteria: goalIncludeCriteriaParams,
                    },
                }),
            ];

            // recording complete state for linked as criteria goal
            if (actualGoal.goalInCriteria.length && actualGoal.state) {
                const earlyIsCompleted = actualGoal.state.type === StateType.Completed;
                const nowIsCompleted = input.state.type === StateType.Completed;

                if (earlyIsCompleted !== nowIsCompleted) {
                    promises.push(
                        prisma.goalHistory.createMany({
                            data: actualGoal.goalInCriteria.map(({ goalId, id }) => ({
                                goalId,
                                nextValue: id,
                                subject: 'criteria',
                                action: nowIsCompleted ? 'complete' : 'uncomplete',
                                activityId,
                            })),
                        }),
                    );
                }
            }

            try {
                const [updatedGoal] = await Promise.all(promises);

                await recalculateCriteriaScore(updatedGoal.id)
                    .recalcLinkedGoalsScores()
                    .recalcAverageProjectScore()
                    .run();

                const recipients = prepareRecipients([
                    ...actualGoal.participants,
                    ...actualGoal.watchers,
                    actualGoal.activity,
                    actualGoal.owner,
                ]);

                await createEmail('goalStateUpdated', {
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
    createComment: protectedProcedure
        .input(goalCommentCreateSchema)
        .use(goalAccessMiddleware)
        .mutation(async ({ ctx, input }) => {
            if (!input.goalId) return null;

            const { activityId, role } = ctx.session.user;

            try {
                return createComment({
                    description: input.description,
                    stateId: input.stateId,
                    activityId,
                    goalId: input.goalId,
                    role,
                });
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
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .use(commentAccessMiddleware)
        .mutation(async ({ input: { id } }) => {
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
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.goalId },
            });

            const { activityId, role } = ctx.session.user;

            if (!actualGoal) {
                return null;
            }

            let isDoneByConnect = false;
            let criteriaTitle = input.title;

            if (input.criteriaGoal?.id) {
                const connectedGoal = await prisma.goal.findUnique({
                    where: { id: input.criteriaGoal.id },
                    include: { state: true },
                });

                if (connectedGoal) {
                    isDoneByConnect = connectedGoal.state?.type === StateType.Completed;

                    // replace by default if have connected goal
                    criteriaTitle = connectedGoal.title;
                }
            }

            try {
                const newCriteria = await prisma.goalAchieveCriteria.create({
                    data: {
                        title: criteriaTitle,
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
                        criteriaGoal: input.criteriaGoal?.id
                            ? {
                                  connect: { id: input.criteriaGoal.id },
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

                const actualGoal = await prisma.goal.findUnique({
                    where: { id: input.goalId },
                    include: {
                        state: true,
                        goalAchiveCriteria: {
                            include: {
                                criteriaGoal: {
                                    include: { state: true },
                                },
                            },
                            where: goalAchiveCriteriaFilter(activityId, role),
                        },
                    },
                });

                if (actualGoal) {
                    await recalculateCriteriaScore(actualGoal.id)
                        .recalcCurrentGoalScore()
                        .recalcAverageProjectScore()
                        .run();
                }

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

            const { activityId, role } = ctx.session.user;

            try {
                if (!currentCriteria) {
                    throw Error('No current criteria');
                }

                let isDoneByConnect: boolean | null = null;
                let criteriaTitle = input.title;

                if (input.criteriaGoal?.id) {
                    const connectedGoal = await prisma.goal.findUnique({
                        where: { id: input.criteriaGoal.id },
                        include: { state: true },
                    });

                    if (connectedGoal) {
                        isDoneByConnect = connectedGoal.state?.type === StateType.Completed;

                        // replace by default if have connected goal
                        criteriaTitle = connectedGoal.title;
                    }
                }

                const [updatedCriteria] = await Promise.all([
                    prisma.goalAchieveCriteria.create({
                        data: {
                            title: criteriaTitle,
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
                            criteriaGoal: input.criteriaGoal?.id
                                ? {
                                      connect: { id: input.criteriaGoal.id },
                                  }
                                : undefined,
                            createdAt: currentCriteria.createdAt,
                        },
                    }),
                    prisma.goalAchieveCriteria.update({
                        where: { id: currentCriteria.id },
                        data: {
                            deleted: true,
                        },
                    }),
                ]);

                const [, actualGoal] = await Promise.all([
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
                    prisma.goal.findUnique({
                        where: { id: input.goalId },
                        include: {
                            state: true,
                            goalAchiveCriteria: {
                                include: {
                                    criteriaGoal: {
                                        include: { state: true },
                                    },
                                },
                                where: goalAchiveCriteriaFilter(activityId, role),
                            },
                        },
                    }),
                ]);

                if (actualGoal) {
                    await recalculateCriteriaScore(actualGoal.id)
                        .recalcCurrentGoalScore()
                        .recalcAverageProjectScore()
                        .run();
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

                await recalculateCriteriaScore(currentCriteria.goalId)
                    .recalcCurrentGoalScore()
                    .recalcAverageProjectScore()
                    .run();
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    removeCriteria: protectedProcedure
        .input(removeCriteria)
        .use(criteriaAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const current = await prisma.goalAchieveCriteria.findFirst({
                where: { id: input.id, OR: [{ deleted: false }, { deleted: null }] },
            });

            try {
                if (current) {
                    await Promise.all([
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
                    ]);

                    await recalculateCriteriaScore(input.goalId)
                        .recalcCurrentGoalScore()
                        .recalcAverageProjectScore()
                        .run();
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

                await prisma.goalAchieveCriteria.update({
                    where: { id: input.id },
                    data: {
                        title: input.title,
                        criteriaGoal: {
                            connect: { id: input.criteriaGoal.id },
                        },
                    },
                });

                await recalculateCriteriaScore(actualCriteria.goalId)
                    .recalcCurrentGoalScore()
                    .recalcAverageProjectScore()
                    .run();
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    addParticipant: protectedProcedure
        .input(toggleParticipantsSchema)
        .use(goalParticipantEditAccessMiddleware)
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
        .use(goalParticipantEditAccessMiddleware)
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
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            if (input.id === input.relation.id) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'ids must be different' });
            }

            try {
                const [updatedGoal] = await Promise.all([
                    prisma.goal.update({
                        where: { id: input.id },
                        data: {
                            [input.kind]: {
                                connect: { id: input.relation.id },
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
                    }),
                    prisma.goal.update({
                        where: { id: input.relation.id },
                        data: {
                            history: {
                                create: {
                                    subject: 'dependencies',
                                    action: 'add',
                                    nextValue: input.id,
                                    activityId: ctx.session.user.activityId,
                                },
                            },
                        },
                    }),
                ]);

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    removeDependency: protectedProcedure
        .input(toggleGoalDependencySchema)
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            try {
                const [updatedGoal] = await Promise.all([
                    prisma.goal.update({
                        where: { id: input.id },
                        data: {
                            [input.kind]: {
                                disconnect: { id: input.relation.id },
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
                    }),
                    prisma.goal.update({
                        where: { id: input.relation.id },
                        data: {
                            history: {
                                create: {
                                    subject: 'dependencies',
                                    action: 'remove',
                                    nextValue: input.id,
                                    activityId: ctx.session.user.activityId,
                                },
                            },
                        },
                    }),
                ]);

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    addPartnerProject: protectedProcedure
        .input(togglePartnerProjectSchema)
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            try {
                const updatedGoal = await prisma.goal.update({
                    where: { id: input.id },
                    data: {
                        partnershipProjects: {
                            connect: { id: input.projectId },
                        },
                        history: {
                            create: {
                                subject: 'partnerProject',
                                action: 'add',
                                nextValue: input.projectId,
                                activityId: ctx.session.user.activityId,
                            },
                        },
                    },
                    include: {
                        activity: { include: { user: true } },
                        owner: { include: { user: true } },
                        participants: { include: { user: true } },
                        watchers: { include: { user: true } },
                    },
                });

                await updateProjectUpdatedAt(updatedGoal.projectId);

                const connectedProject = await prisma.project.findUnique({
                    where: { id: input.projectId },
                    include: {
                        activity: { include: { user: true } },
                        accessUsers: { include: { user: true } },
                        participants: { include: { user: true } },
                        watchers: { include: { user: true } },
                    },
                });

                let recipients: string[] = [];

                if (updatedGoal && connectedProject) {
                    recipients = prepareRecipients([
                        updatedGoal.owner,
                        updatedGoal.activity,
                        connectedProject.activity,
                        ...updatedGoal.participants,
                        ...updatedGoal.watchers,
                        ...connectedProject.accessUsers,
                        ...connectedProject.participants,
                        ...connectedProject.watchers,
                    ]);
                }

                await createEmail('addPartnerProjectToGoal', {
                    to: recipients,
                    key: `${updatedGoal.projectId}-${updatedGoal.scopeId}`,
                    title: updatedGoal.title,
                    partnerProject: {
                        key: connectedProject?.id,
                        title: connectedProject?.title,
                    },
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                return updatedGoal;
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
            }
        }),
    removePartnerProject: protectedProcedure
        .input(togglePartnerProjectSchema)
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            try {
                const updatedGoal = await prisma.goal.update({
                    where: { id: input.id },
                    data: {
                        partnershipProjects: {
                            disconnect: { id: input.projectId },
                        },
                        history: {
                            create: {
                                subject: 'partnerProject',
                                action: 'remove',
                                previousValue: input.projectId,
                                activityId: ctx.session.user.activityId,
                            },
                        },
                    },
                    include: {
                        activity: { include: { user: true } },
                        owner: { include: { user: true } },
                        participants: { include: { user: true } },
                        watchers: { include: { user: true } },
                    },
                });

                const disconnectedProject = await prisma.project.findUnique({
                    where: { id: input.projectId },
                    include: {
                        activity: { include: { user: true } },
                        accessUsers: { include: { user: true } },
                        participants: { include: { user: true } },
                        watchers: { include: { user: true } },
                    },
                });

                let recipients: string[] = [];

                if (updatedGoal && disconnectedProject) {
                    recipients = [
                        updatedGoal.owner,
                        updatedGoal.activity,
                        disconnectedProject.activity,
                        ...updatedGoal.participants,
                        ...updatedGoal.watchers,
                        ...disconnectedProject.accessUsers,
                        ...disconnectedProject.participants,
                        ...disconnectedProject.watchers,
                    ].reduce<string[]>((acc, cur) => {
                        if (cur?.user?.email) {
                            acc.push(cur.user.email);
                        }
                        return acc;
                    }, []);
                }

                await createEmail('removePartnerProjectToGoal', {
                    to: recipients,
                    key: `${updatedGoal.projectId}-${updatedGoal.scopeId}`,
                    title: updatedGoal.title,
                    partnerProject: {
                        key: disconnectedProject?.id,
                        title: disconnectedProject?.title,
                    },
                    author: ctx.session.user.name || ctx.session.user.email,
                    authorEmail: ctx.session.user.email,
                });

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return updatedGoal;
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
        .use(goalAccessMiddleware)
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
        .use(goalEditAccessMiddleware)
        .mutation(async ({ input, ctx }) => {
            const { activityId, role } = ctx.session.user;
            const actualGoal = await prisma.goal.findUnique({
                where: { id: input.id },
                include: {
                    project: { include: { goals: true } },
                    participants: { include: { user: true, ghost: true } },
                },
            });

            if (!actualGoal) return null;
            if (actualGoal.ownerId === input.ownerId) return null;
            if (actualGoal.project?.personal) {
                const newProject = await createPersonalProject({
                    ownerId: input.ownerId,
                    activityId,
                    role,
                });

                await changeGoalProject(actualGoal.id, newProject.id);

                if (actualGoal.projectId) {
                    await updateProjectUpdatedAt(actualGoal.projectId);
                    await clearEmptyPersonalProject(actualGoal.projectId);
                }
            }

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
                        participants: actualGoal.project?.personal
                            ? {
                                  set: [{ id: input.ownerId }, { id: activityId }],
                              }
                            : {},
                        history: {
                            create: history,
                        },
                    },
                    include: {
                        ...getGoalDeepQuery({
                            activityId,
                            role,
                        }),
                        goalInCriteria: goalIncludeCriteriaParams,
                    },
                });

                await updateProjectUpdatedAt(updatedGoal.projectId);

                return { ...updatedGoal, ...addCalculatedGoalsFields(updatedGoal, activityId, role) };
            } catch (error: any) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: String(error.message),
                    cause: error,
                });
            }
        }),
    getGoalCriteriaList: protectedProcedure
        .input(z.object({ id: z.string().optional() }))
        .use(goalAccessMiddleware)
        .query(async ({ input, ctx }) => {
            if (!input.id) {
                return;
            }

            const { activityId, role } = ctx.session.user;

            try {
                const criteriaList = await prisma.goalAchieveCriteria.findMany({
                    where: {
                        AND: [
                            { goalId: input.id },
                            {
                                OR: [{ deleted: false }, { deleted: null }],
                            },
                            goalAchiveCriteriaFilter(activityId, role),
                        ],
                    },
                    include: {
                        criteriaGoal: {
                            include: {
                                state: true,
                            },
                        },
                    },
                });

                const sorted = criteriaList.reduce<Record<'done' | 'undone', Array<(typeof criteriaList)[number]>>>(
                    (acc, criteria) => {
                        if (criteria.isDone) {
                            acc.done.push(criteria);
                        } else {
                            acc.undone.push(criteria);
                        }
                        return acc;
                    },
                    {
                        done: [],
                        undone: [],
                    },
                );

                return sorted.done.concat(sorted.undone).map(({ criteriaGoal, ...criteria }) => {
                    if (criteriaGoal) {
                        criteriaGoal.scopeId;
                        criteriaGoal.projectId;
                        return {
                            ...criteria,
                            criteriaGoal: {
                                ...criteriaGoal,
                                _shortId: getShortId(criteriaGoal),
                            },
                        };
                    }

                    return { ...criteria, criteriaGoal: null };
                });
            } catch (error: any) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message, cause: error });
            }
        }),
    checkGoalInExistingCriteria: protectedProcedure
        .input(
            z.object({
                criteriaGoalId: z.string(),
                goalId: z.string(),
            }),
        )
        .use(goalAccessMiddleware)
        .query(async ({ input }) => {
            const { goalId, criteriaGoalId } = input;
            const criteria = await prisma.goalAchieveCriteria.findFirst({
                where: {
                    AND: {
                        goalId,
                        criteriaGoalId,
                        OR: [{ deleted: null }, { deleted: false }],
                    },
                },
            });

            if (criteria != null) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'These bindings is already exist' });
            }

            return null;
        }),
});
