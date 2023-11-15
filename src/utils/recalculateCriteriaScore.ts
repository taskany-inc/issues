import { Goal, GoalAchieveCriteria, Prisma, PrismaClient, State, StateType } from '@prisma/client';

import { prisma } from './prisma';

export const goalIncludeCriteriaParams = {
    include: {
        criteriaGoal: {
            include: { state: true },
        },
        goal: true,
    },
} as const;

const maxPossibleCriteriaWeight = 100;

interface GoalCriteria extends GoalAchieveCriteria {
    goal: Goal | null;
    criteriaGoal: (Goal & { state: State | null }) | null;
}

// simple calc score value for single goal
export const calcAchievedWeight = <T extends GoalCriteria>(criteriaList: T[]): number => {
    let achivedWithWeight = 0;
    let comletedWithoutWeight = 0;
    let anyWithoutWeight = 0;
    let allWeight = 0;

    for (const { deleted, weight, isDone, criteriaGoal } of criteriaList) {
        // `where` filter by `deleted` field doesn't work in *Many queries
        if (!deleted) {
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
    }

    const remainingtWeight = maxPossibleCriteriaWeight - allWeight;
    const quantityByWeightlessCriteria = anyWithoutWeight > 0 ? remainingtWeight / anyWithoutWeight : 0;

    return Math.min(
        achivedWithWeight + Math.ceil(quantityByWeightlessCriteria * comletedWithoutWeight),
        maxPossibleCriteriaWeight,
    );
};

type GoalCalculateScore = Goal & {
    goalInCriteria?: Array<GoalCriteria> | null;
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

export const recalculateCriteriaScore = (goalId: string) => {
    let currentGoal: GoalCalculateScore | null;
    const getCurrentGoal = async () => {
        if (!currentGoal) {
            currentGoal = await prisma.goal.findUnique({
                where: { id: goalId },
                include: {
                    goalInCriteria: goalIncludeCriteriaParams,
                    goalAchiveCriteria: goalIncludeCriteriaParams,
                },
            });
        }

        return currentGoal;
    };

    let prismaCtx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promisesChain: (() => Promise<any>)[] = [];

    const updateGoalScore = ({ id, score }: { id: string; score: number | null }, includeParams = false) => {
        return prismaCtx.goal.update({
            where: { id },
            data: { completedCriteriaWeight: score },
            include: includeParams
                ? {
                      goalInCriteria: goalIncludeCriteriaParams,
                  }
                : null,
        });
    };

    const methods = {
        recalcCurrentGoalScore: () => {
            promisesChain.push(async () => {
                const goal = await getCurrentGoal();

                if (goal) {
                    const { goalAchiveCriteria: list, id: goalId } = goal;
                    let score: number | null = null;
                    if (list?.length && list.some(({ deleted }) => !deleted)) {
                        score = calcAchievedWeight(list);
                    }

                    currentGoal = await updateGoalScore({ id: goalId, score }, true);

                    return currentGoal;
                }
            });

            return methods;
        },
        recalcAverageProjectScore: () => {
            promisesChain.push(async () => {
                const goal = await getCurrentGoal();

                if (goal) {
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
                            where goal."projectId" in (${Prisma.join(
                                Array.from(projectIds),
                            )}) and goal."archived" is not true
                            group by 1
                    `;

                    return prismaCtx.$executeRaw`
                        update "Project" as project
                        set "averageScore" = scoreByProject.score
                        from (${countsRequests}) as scoreByProject(projectId, score)
                        where project.id = scoreByProject.projectId
                `;
                }
            });

            return methods;
        },
        recalcLinkedGoalsScores: () => {
            promisesChain.push(async () => {
                const goal = await getCurrentGoal();

                if (goal) {
                    const { goalInCriteria } = goal;

                    const goalIdsToUpdate = goalInCriteria?.reduce<string[]>((acc, { goalId }) => {
                        acc.push(goalId);

                        return acc;
                    }, []);

                    if (goalIdsToUpdate?.length) {
                        const criteriaList = await prisma.goalAchieveCriteria.findMany({
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

                        return Promise.all(
                            Object.entries(groupedCriteriaListByGoals).map(([goalId, list]) => {
                                let score: number | null = null;
                                if (list.length && list.some(({ deleted }) => deleted == null || deleted === false)) {
                                    score = calcAchievedWeight(list);
                                }

                                return updateGoalScore({ id: goalId, score });
                            }),
                        );
                    }
                }
            });

            return methods;
        },
        async run() {
            return prisma.$transaction((ctx) => {
                prismaCtx = ctx;

                return promisesChain.reduce((promise, getter) => promise.then(getter), Promise.resolve());
            });
        },
    };
    return methods;
};
