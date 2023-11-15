import { nanoid } from 'nanoid';
import { GoalHistory, Comment, Activity, User, Goal, Role, Prisma, Reaction, StateType } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { GoalCommon, dependencyKind, exceptionsDependencyKind } from '../schema/goal';
import { addCalculatedGoalsFields } from '../../trpc/queries/goals';
import { HistoryRecordWithActivity, HistoryRecordSubject, HistoryAction } from '../types/history';
import { ReactionsMap } from '../types/reactions';

import { prisma } from './prisma';
import { subjectToEnumValue } from './goalHistory';
import { safeGetUserName } from './getUserName';
import { calcAchievedWeight } from './recalculateCriteriaScore';

/**
 * Type-safe wrapper in raw SQL query.
 * This is only one way to create scopeId in one transaction to avoid id constraints.
 * We are using short id's like FRNTND-23 on client side, but this is not real id,
 * this is concatanation of Goal.projectId and Goal.scopeId.
 * ProjectId is a scope for goals in the Goal table.
 *
 * @param activityId issuer id
 * @param input goal FormData
 * @returns new goal id
 */
export const createGoal = async (input: GoalCommon, activityId: string, role: Role) => {
    const id = nanoid();
    const priorityId = input.priority.id;

    await prisma.$executeRaw`
        INSERT INTO "Goal" ("id", "title", "description", "projectId", "ownerId", "activityId", "stateId", "priorityId", "scopeId")
        SELECT
            ${id},
            ${input.title},
            ${input.description || ''},
            ${input.parent.id},
            ${input.owner.id},
            ${activityId},
            ${input.state.id},
            ${priorityId},
            coalesce(max("scopeId"), 0) + 1
        FROM "Goal" WHERE "projectId" = ${input.parent.id};
    `;

    const goal = await prisma.goal.update({
        where: {
            id,
        },
        data: {
            priority: {
                connect: {
                    id: priorityId,
                },
            },
            tags: input.tags?.length
                ? {
                      connect: input.tags.map(({ id }) => ({ id })),
                  }
                : undefined,
            estimate: input.estimate ? new Date(input.estimate.date) : null,
            estimateType: input.estimate?.type,
            watchers: {
                connect: [{ id: activityId }, { id: input.owner.id }],
            },
            participants: {
                connect: [{ id: activityId }, { id: input.owner.id }],
            },
        },
        include: {
            activity: { include: { user: true, ghost: true } },
            owner: { include: { user: true, ghost: true } },
        },
    });

    return {
        ...goal,
        ...addCalculatedGoalsFields(goal, activityId, role),
    };
};

export const changeGoalProject = async (id: string, newProjectId: string) => {
    return prisma.$executeRaw`
        UPDATE "Goal"
        SET "projectId" = ${newProjectId}, "scopeId" = (SELECT coalesce(max("scopeId"), 0) + 1 FROM "Goal" WHERE "projectId" = ${newProjectId})
        WHERE "id" = ${id};
    `;
};

type RequestParamsBySubject = { [K in keyof HistoryRecordSubject]?: { ids: string[]; sourceIdx: number[] } };

export const goalHistorySeparator = ', ';

export const getGoalHistory = async <T extends GoalHistory & { activity: Activity & { user: User | null } }>(
    history: T[],
) => {
    const requestParamsBySubjects = history.reduce<RequestParamsBySubject>(
        (acc, { subject, previousValue, nextValue }, index) => {
            const allValues = (previousValue ?? '')
                .split(goalHistorySeparator)
                .concat((nextValue ?? '').split(goalHistorySeparator))
                .filter(Boolean);

            if (subjectToEnumValue(subject)) {
                acc[subject] = {
                    ids: (acc[subject]?.ids ?? []).concat(...allValues),
                    sourceIdx: (acc[subject]?.sourceIdx ?? []).concat(index),
                };
            }

            return acc;
        },
        {},
    );

    const historyWithMeta: HistoryRecordWithActivity[] = Array.from(history);
    const needRequestForSubject = Object.keys(requestParamsBySubjects) as (keyof typeof requestParamsBySubjects)[];
    const replacedValueIdx = needRequestForSubject
        .map((subject) => (requestParamsBySubjects[subject] || {}).sourceIdx)
        .flat();

    if (needRequestForSubject.length) {
        const results = await Promise.all(
            needRequestForSubject.map((subject) => {
                const { ids } = requestParamsBySubjects[subject] || {};

                const query = {
                    where: {
                        id: {
                            in: ids,
                        },
                    },
                };

                switch (subject) {
                    case 'dependencies':
                        return prisma.goal.findMany({
                            where: query.where,
                            include: {
                                state: true,
                            },
                        });
                    case 'tags':
                        return prisma.tag.findMany(query);
                    case 'owner':
                    case 'participants':
                        return prisma.activity.findMany({
                            where: query.where,
                            include: {
                                user: true,
                                ghost: true,
                            },
                        });
                    case 'state':
                        return prisma.state.findMany({ where: query.where });
                    case 'project':
                        return prisma.project.findMany({ where: query.where });
                    case 'partnerProject':
                        return prisma.project.findMany({ where: query.where });
                    case 'criteria':
                        return prisma.goalAchieveCriteria.findMany({
                            where: query.where,
                            include: {
                                criteriaGoal: {
                                    include: {
                                        state: true,
                                    },
                                },
                            },
                        });
                    case 'priority':
                        return prisma.priority.findMany({ where: query.where });
                    default:
                        throw new Error('query for history record is undefined');
                }
            }),
        );

        const metaResults: Record<string, (typeof results)[number][number]>[] = [];

        for (const records of results) {
            const meta: Record<string, (typeof records)[number]> = {};

            for (const record of records) {
                meta[record.id] = record;
            }

            metaResults.push(meta);
        }

        const metaObj = metaResults.reduce((acc, values) => {
            acc = { ...acc, ...values };

            return acc;
        }, {});

        replacedValueIdx.forEach((sourceIndex) => {
            if (sourceIndex == null) {
                return;
            }

            const record = history[sourceIndex];
            const valueCanBeArray = ['dependencies', 'tags', 'estimates'].includes(record.subject);

            if (valueCanBeArray) {
                historyWithMeta[sourceIndex] = {
                    ...record,
                    action: record.action as HistoryAction,
                    previousValue: record.previousValue?.split(', ').map((id) => metaObj[id]),
                    nextValue: record.nextValue?.split(', ').map((id) => metaObj[id]),
                };
            } else {
                historyWithMeta[sourceIndex] = {
                    ...record,
                    action: record.action as HistoryAction,
                    previousValue: record.previousValue ? metaObj[record.previousValue] : null,
                    nextValue: record.nextValue ? metaObj[record.nextValue] : null,
                };
            }
        });
    }

    return historyWithMeta;
};

type mixHistoryWithCommentsReturnType<H, C> =
    | { type: 'history'; value: H }
    | { type: 'comment'; value: Omit<C, 'reactions'> & { reactions: ReactionsMap } };
export const mixHistoryWithComments = <
    H extends HistoryRecordWithActivity,
    C extends Comment & { reactions: (Reaction & Pick<HistoryRecordWithActivity, 'activity'>)[] },
>(
    history: H[],
    comments: C[],
): {
    _activityFeed: mixHistoryWithCommentsReturnType<H, C>[];
    _comments: Extract<mixHistoryWithCommentsReturnType<H, C>, { type: 'comment' }>['value'][];
    comments: C[];
} => {
    const activity: mixHistoryWithCommentsReturnType<H, C>[] = history.map((record) => {
        return {
            type: 'history',
            value: record,
        };
    });

    const limit = 10;
    const _comments = comments?.map((comment) => {
        const reactions = comment?.reactions?.reduce<ReactionsMap>((acc, cur) => {
            const data = {
                activityId: cur.activityId,
                name: safeGetUserName(cur.activity),
            };

            if (acc[cur.emoji]) {
                acc[cur.emoji].count += 1;
                acc[cur.emoji].authors.push(data);
            } else {
                acc[cur.emoji] = {
                    count: 1,
                    authors: [data],
                    remains: 0,
                };
            }

            return acc;
        }, {});

        for (const key in reactions) {
            if (key in reactions) {
                const { authors } = reactions[key];

                if (authors.length > limit) {
                    reactions[key].authors = authors.slice(0, limit);
                    reactions[key].remains = authors.length - limit;
                }
            }
        }

        return {
            ...comment,
            reactions,
        };
    });

    for (const comment of _comments) {
        activity.push({
            type: 'comment',
            value: comment,
        });
    }

    return {
        _activityFeed: activity.sort((a, b) => a.value.createdAt.getTime() - b.value.createdAt.getTime()),
        _comments,
        comments: [],
    };
};

type GoalRelation<T> = T & { _kind: dependencyKind | exceptionsDependencyKind } & ReturnType<
        typeof addCalculatedGoalsFields
    >;
export const makeGoalRelationMap = <T extends Goal>(
    values: Record<dependencyKind | exceptionsDependencyKind, T[]>,
    activityId: string,
    role: Role,
): Array<{ kind: dependencyKind; goals: GoalRelation<T>[] }> => {
    const entriesValues = Object.entries(values) as [dependencyKind | exceptionsDependencyKind, T[]][];

    const dependenciesMap = entriesValues.reduce<Record<dependencyKind, GoalRelation<T>[]>>(
        (acc, [kind, goals]) => {
            const goalsWithKindByDependency = goals.map((goal) => ({
                ...goal,
                ...addCalculatedGoalsFields(goal, activityId, role),
                _kind: kind,
            }));

            if (kind === exceptionsDependencyKind.connected) {
                acc[dependencyKind.relatedTo].push(...goalsWithKindByDependency);
                return acc;
            }

            acc[kind].push(...goalsWithKindByDependency);
            return acc;
        },
        {
            [dependencyKind.blocks]: [],
            [dependencyKind.dependsOn]: [],
            [dependencyKind.relatedTo]: [],
        },
    );

    return (Object.entries(dependenciesMap) as [dependencyKind, GoalRelation<T>[]][]).map(([kind, goals]) => ({
        kind,
        goals,
    }));
};

export const updateLinkedGoalsByProject = async (projectId: string, activityId: string) => {
    // current projects's goals
    const goalIds = await prisma.goal.findMany({
        where: {
            projectId,
            AND: {
                archived: {
                    not: true,
                },
            },
        },
        select: {
            id: true,
        },
    });

    if (goalIds.length) {
        try {
            await prisma.$transaction(async (ctx) => {
                // move all active goals to archive
                const archiveGoals = ctx.goal.updateMany({
                    where: {
                        projectId,
                        AND: {
                            archived: { not: true },
                        },
                    },
                    data: { archived: true },
                });

                // create history records for these goals
                const createHistoryRecords = ctx.goalHistory.createMany({
                    data: goalIds.map(({ id }) => ({
                        subject: 'state',
                        action: 'archive',
                        activityId,
                        nextValue: 'move to archive',
                        goalId: id,
                    })),
                });

                // mark criterias with these goals as deleted
                const updateCriterias = ctx.goalAchieveCriteria.updateMany({
                    where: {
                        goalIdAsCriteria: {
                            in: goalIds.map(({ id }) => id),
                        },
                    },
                    data: { deleted: true },
                });

                await Promise.all([archiveGoals, createHistoryRecords, updateCriterias]);

                // get all goals which current project's goals as criteria
                const linkedGoalsWithCriteria = await ctx.goal.findMany({
                    where: {
                        goalAchiveCriteria: {
                            some: {
                                criteriaGoalId: { in: goalIds.map(({ id }) => id) },
                            },
                        },
                    },
                    select: {
                        id: true,
                        goalAchiveCriteria: {
                            include: {
                                criteriaGoal: {
                                    include: { state: true },
                                },
                            },
                        },
                    },
                });

                if (linkedGoalsWithCriteria.length) {
                    const inFilter = Prisma.join(linkedGoalsWithCriteria.map(({ id }) => id));
                    const values = Prisma.join(
                        linkedGoalsWithCriteria.map((value) =>
                            Prisma.join(
                                [
                                    value.id,
                                    calcAchievedWeight(
                                        value.goalAchiveCriteria.map(({ weight, isDone, deleted, criteriaGoal }) => ({
                                            weight,
                                            isDone,
                                            deleted,
                                            goalState: criteriaGoal?.state?.type,
                                        })),
                                    ),
                                ],
                                ',',
                                '(',
                                ')',
                            ),
                        ),
                    );

                    const tempTableValues = Prisma.sql`(VALUES${values}) AS criteria(goalId, score)`;
                    const tempSelectScoreGoals = Prisma.sql`
                        SELECT AVG(
                            CASE
                                WHEN g."completedCriteriaWeight" IS NOT NULL AND g."completedCriteriaWeight" > 0 THEN g."completedCriteriaWeight"
                                WHEN state.type = '${Prisma.raw(
                                    StateType.Completed,
                                )}' AND g."completedCriteriaWeight" IS NULL THEN 100
                                ELSE 0
                            END
                        )::int AS score, g."projectId" AS "projectId"
                            FROM "Goal" AS g
                            INNER JOIN "State" AS state ON state.id = g.stateId
                            WHERE g.id IN (${inFilter}) AND g.archived IS NOT TRUE
                            GROUP BY g."projectId"
                    `;

                    // update goal score after mark criteria as deleted
                    await ctx.$executeRaw`
                        UPDATE "Goal" AS goal
                            SET "completedCriteriaWeight" = criteria.score
                            FROM ${tempTableValues}
                        WHERE goal.id = criteria.goalId;
                    `;

                    // recalc average affected projects score
                    await ctx.$executeRaw`
                        UPDATE "Project" AS project
                            SET "averageScore" = goal."score"
                            FROM (${tempSelectScoreGoals}) AS goal
                            WHERE project.id = goal."projectId";
                        `;
                }
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', cause: error, message: error?.message });
        }
    }
};
