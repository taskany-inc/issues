import { Expression, SqlBool } from 'kysely';

import { getRankSeries } from '../../src/utils/ranking';
import { db } from '../connection/kysely';

export const getGoalRank = (goalId: string, activityId?: string) => {
    return db
        .selectFrom('GoalRank')
        .where((eb) => {
            const filters: Expression<SqlBool>[] = [];
            filters.push(eb('goalId', '=', goalId));
            if (activityId) {
                filters.push(eb('activityId', '=', activityId));
            } else {
                filters.push(eb('activityId', 'is', null));
            }
            return eb.and(filters);
        })
        .select(['value']);
};

export const updateGoalRanks = (data: { goalId: string; value: number }[], activityId?: string) => {
    const dataWithActivityId = data.map((d) => ({ ...d, activityId }));
    return db
        .insertInto('GoalRank')
        .values(dataWithActivityId)
        .onConflict((oc) => {
            if (activityId) {
                return oc
                    .columns(['goalId', 'activityId'])
                    .where('GoalRank.activityId', 'is not', null)
                    .doUpdateSet({ value: (eb) => eb.ref('excluded.value') });
            }
            return oc
                .columns(['goalId'])
                .where('GoalRank.activityId', 'is', null)
                .doUpdateSet({ value: (eb) => eb.ref('excluded.value') });
        });
};

export const recalculateGoalRanksIfNeeded = async (projectId: string, activityId?: string) => {
    const [{ goalCount }, { rankCount }] = await Promise.all([
        db
            .selectFrom('Goal')
            .where('projectId', '=', projectId)
            .select((eb) => eb.fn.count<number>('id').as('goalCount'))
            .executeTakeFirstOrThrow(),
        db
            .selectFrom('GoalRank')
            .leftJoin('Goal', 'GoalRank.goalId', 'Goal.id')
            .where((eb) => {
                const filters: Expression<SqlBool>[] = [];
                filters.push(eb('Goal.projectId', '=', projectId));
                if (activityId) {
                    filters.push(eb('GoalRank.activityId', '=', activityId));
                } else {
                    filters.push(eb('GoalRank.activityId', 'is', null));
                }
                return eb.and(filters);
            })
            .select((eb) => eb.fn.count<number>('Goal.id').as('rankCount'))
            .executeTakeFirstOrThrow(),
    ]);
    if (goalCount === rankCount) return;
    const ranks = getRankSeries(goalCount);
    const goals = await db
        .selectFrom('Goal')
        .where('projectId', '=', projectId)
        .leftJoin(
            (eb) => {
                const filters: Expression<SqlBool>[] = [];
                if (activityId) {
                    filters.push(eb('activityId', '=', activityId));
                } else {
                    filters.push(eb('activityId', 'is', null));
                }
                return eb.selectFrom('GoalRank').select(['goalId', 'value']).where(eb.and(filters)).as('ranks');
            },

            (join) => join.onRef('ranks.goalId', '=', 'Goal.id'),
        )
        .orderBy('ranks.value asc')
        .orderBy('updatedAt desc')
        .select(['id'])
        .execute();
    await updateGoalRanks(
        goals.map((g, i) => ({ goalId: g.id, value: ranks[i] })),
        activityId,
    ).execute();
};
