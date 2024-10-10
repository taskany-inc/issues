import type { Goal, GoalAchieveCriteria, PrismaClient, State } from '@prisma/client';
import { Prisma, StateType } from '@prisma/client';
import type { ITXClientDenyList } from '@prisma/client/runtime';

import { prisma } from './prisma';

export const goalIncludeCriteriaParams = {
    include: {
        criteriaGoal: {
            include: { state: true },
        },
        goal: {
            include: { state: true },
        },
    },
} as const;

const maxPossibleCriteriaWeight = 100;

interface GoalCriteria extends GoalAchieveCriteria {
    goal: Goal | null;
    criteriaGoal: (Goal & { state: State | null }) | null;
}

export const baseCalcCriteriaWeight = <
    G extends { state: { type: StateType } | null; completedCriteriaWeight: number | null },
    T extends { deleted: boolean | null; weight: number; isDone: boolean; criteriaGoal: G | null },
>(
    criteriaList: T[],
): number => {
    let achivedWithWeight = 0;
    let comletedWithoutWeight = 0;
    let anyWithoutWeight = 0;
    let allWeight = 0;

    // `where` filter by `deleted` field doesn't work in *Many queries
    const existingCriteriaList = criteriaList.filter(({ deleted }) => !deleted);

    for (const { weight, isDone, criteriaGoal } of existingCriteriaList) {
        allWeight += weight;

        if (!weight) {
            anyWithoutWeight += 1;
        }

        if (isDone || criteriaGoal?.state?.type === StateType.Completed) {
            achivedWithWeight += weight;

            if (!weight) {
                comletedWithoutWeight += 1;
            }
        }
    }

    const remainingtWeight = maxPossibleCriteriaWeight - allWeight;
    const quantityByWeightlessCriteria = anyWithoutWeight > 0 ? remainingtWeight / anyWithoutWeight : 0;

    // accounting partial criteria goal score
    for (const { weight, isDone, criteriaGoal } of existingCriteriaList) {
        if (!isDone && criteriaGoal != null && criteriaGoal.completedCriteriaWeight != null) {
            const targetWeight = weight || quantityByWeightlessCriteria;

            if (criteriaGoal.completedCriteriaWeight > 0) {
                achivedWithWeight += Math.floor((targetWeight / 100) * criteriaGoal.completedCriteriaWeight);
            }
        }
    }

    return Math.min(
        achivedWithWeight + Math.ceil(quantityByWeightlessCriteria * comletedWithoutWeight),
        maxPossibleCriteriaWeight,
    );
};

// simple calc score value for single goal
export const calcAchievedWeight = (criteriaList: GoalCriteria[]): number => {
    return baseCalcCriteriaWeight(criteriaList);
};

type GoalCalculateScore = Goal & {
    goalInCriteria: Array<GoalCriteria> | null;
    goalAchiveCriteria?: Array<GoalCriteria> | null;
};

/**
 * 1. Get actual goal data after one of next actions
 *     Change state by manual, comment or editing
 *     Add any goal as criteria for current goal
 *     Add simple criteria
 *     Change criteria state
 *     Remove criteria
 *     Edit criteria
 * 2. For the actual goal needs recalculate weight of completed criteria
 * 3. Recalculate the average project's score
 * 4. If the current goal is criteria for any goals
 *    and the current goal's state changes from `Completed` or to `Completed`
 *    then for all goals needs recalculate score and parents project's average score
 */

interface CriteriaScoreUpdateBaseApi {
    recalcCurrentGoalScore: () => CriteriaScoreUpdateApi & CriteriaScoreUpdateBaseApi;
    recalcAverageProjectScore: () => CriteriaScoreUpdateApi & CriteriaScoreUpdateBaseApi;
    recalcLinkedGoalsScores: () => CriteriaScoreUpdateApi & CriteriaScoreUpdateBaseApi;
}

interface CriteriaScoreUpdateApi {
    run: () => Promise<void>;
    makeChain: (
        ...names: Array<keyof CriteriaScoreUpdateBaseApi>
    ) => CriteriaScoreUpdateApi & CriteriaScoreUpdateBaseApi;
}

export const recalculateCriteriaScore = (goalId: string) => {
    let currentGoal: GoalCalculateScore;
    let countsToUpdate: number;
    let count = 0;

    const getCurrentGoal = async () => {
        if (!currentGoal || countsToUpdate > count++) {
            currentGoal = await prisma.goal.findUniqueOrThrow({
                where: { id: goalId },
                include: {
                    goalInCriteria: goalIncludeCriteriaParams,
                    goalAchiveCriteria: goalIncludeCriteriaParams,
                },
            });
        }

        return currentGoal;
    };

    let prismaCtx: Omit<PrismaClient, ITXClientDenyList>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promisesChain: (() => Promise<void>)[] = [];

    const updateGoalScore = ({ id, score }: { id: string; score: number | null }) => {
        return prismaCtx.goal.update({
            where: { id },
            data: { completedCriteriaWeight: score },
        });
    };

    const run = () => {
        return prisma.$transaction((ctx) => {
            prismaCtx = ctx;
            countsToUpdate = promisesChain.length;

            return promisesChain.reduce((promise, getter) => promise.then(getter), Promise.resolve());
        });
    };

    const methods: CriteriaScoreUpdateApi & CriteriaScoreUpdateBaseApi = {
        recalcCurrentGoalScore: () => {
            promisesChain.push(async () => {
                const goal = await getCurrentGoal();

                const { goalAchiveCriteria: list, id: goalId } = goal;
                let score: number | null = null;

                if (list?.length && list.some(({ deleted }) => !deleted)) {
                    score = calcAchievedWeight(list);
                }

                await updateGoalScore({ id: goalId, score });
            });

            return methods;
        },
        recalcAverageProjectScore: () => {
            promisesChain.push(async () => {
                const goal = await getCurrentGoal();
                const projectIds = new Set<string>();

                if (goal.projectId) {
                    projectIds.add(goal.projectId);
                }

                if (goal.goalInCriteria?.length) {
                    goal.goalInCriteria.forEach(({ goal }) => {
                        if (goal?.projectId) {
                            projectIds.add(goal.projectId);
                        }
                    });
                }

                if (!projectIds.size) {
                    return;
                }

                const countsRequests = Prisma.sql`
                    select
                        goal."projectId",
                        avg(case
                            when goal."completedCriteriaWeight" is not null and goal."completedCriteriaWeight" > 0 then goal."completedCriteriaWeight"
                            when state.type = '${Prisma.raw(
                                StateType.Completed,
                            )}' and goal."completedCriteriaWeight" is null then 100
                            else 0
                        end)::int
                    from "Goal" as goal
                    inner join "State" as state on goal."stateId" = state.id
                    where goal."projectId" in (${Prisma.join(Array.from(projectIds))}) and goal."archived" is not true
                    group by 1
                `;

                await prismaCtx.$executeRaw`
                    update "Project" as project
                    set "averageScore" = scoreByProject.score
                    from (${countsRequests}) as scoreByProject(projectId, score)
                    where project.id = scoreByProject.projectId
                `;
            });

            return methods;
        },
        recalcLinkedGoalsScores: () => {
            promisesChain.push(async () => {
                const goal = await getCurrentGoal();

                const { goalInCriteria = [] } = goal;

                const goalIdsToUpdate = goalInCriteria?.reduce<string[]>((acc, { goalId }) => {
                    acc.push(goalId);

                    return acc;
                }, []);

                if (goalIdsToUpdate?.length) {
                    const criteriaList = await prismaCtx.goalAchieveCriteria.findMany({
                        where: {
                            goalId: { in: goalIdsToUpdate },
                            AND: {
                                OR: [{ deleted: false }, { deleted: null }],
                            },
                        },
                        include: {
                            criteriaGoal: {
                                include: { state: true },
                            },
                            goal: {
                                include: { state: true },
                            },
                        },
                    });

                    const groupedCriteriaListByGoals = criteriaList.reduce<
                        Record<string, Array<(typeof criteriaList)[number]>>
                    >((acc, criteria) => {
                        if (!acc[criteria.goalId]) {
                            acc[criteria.goalId] = [];
                        }

                        acc[criteria.goalId].push(criteria);

                        return acc;
                    }, {});

                    const values = Prisma.join(
                        Object.entries(groupedCriteriaListByGoals).map(([id, list]) =>
                            Prisma.join([id, calcAchievedWeight(list)], ',', '(', ')'),
                        ),
                    );

                    const tempTableValues = Prisma.sql`(VALUES${values}) AS criteria(goalId, score)`;

                    await prismaCtx.$executeRaw`
                        UPDATE "Goal" AS goal
                            SET "completedCriteriaWeight" = criteria.score
                            FROM ${tempTableValues}
                        WHERE goal.id = criteria.goalId;
                    `;
                }
            });

            return methods;
        },
        run,
        makeChain(...names) {
            names.forEach((name) => {
                methods[name]();
            });

            return methods;
        },
    };
    return methods;
};
