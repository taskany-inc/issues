import { getRankSeries } from '../../src/utils/ranking';
import { db } from '../connection/kysely';

export const getGoalRank = (activityId: string, goalId: string) => {
    return db
        .selectFrom('GoalRank')
        .where('activityId', '=', activityId)
        .where('goalId', '=', goalId)
        .select(['value']);
};

export const updateGoalRank = (data: { activityId: string; goalId: string; value: number }[]) => {
    return db
        .insertInto('GoalRank')
        .values(data)
        .onConflict((oc) =>
            oc.columns(['activityId', 'goalId']).doUpdateSet({ value: (eb) => eb.ref('excluded.value') }),
        );
};

export const recalculateGoalRanksIfNeeded = async (projectId: string, activityId: string) => {
    const [{ goalCount }, { rankCount }] = await Promise.all([
        db
            .selectFrom('Goal')
            .where('projectId', '=', projectId)
            .select((eb) => eb.fn.count<number>('id').as('goalCount'))
            .executeTakeFirstOrThrow(),
        db
            .selectFrom('GoalRank')
            .leftJoin('Goal', 'GoalRank.goalId', 'Goal.id')
            .where('Goal.projectId', '=', projectId)
            .where('Goal.activityId', '=', activityId)
            .select((eb) => eb.fn.count<number>('Goal.id').as('rankCount'))
            .executeTakeFirstOrThrow(),
    ]);
    if (goalCount === rankCount) return;
    const ranks = getRankSeries(goalCount);
    const goals = await db
        .selectFrom('Goal')
        .where('projectId', '=', projectId)
        .leftJoin(
            (eb) =>
                eb.selectFrom('GoalRank').select(['goalId', 'value']).where('activityId', '=', activityId).as('ranks'),
            (join) => join.onRef('ranks.goalId', '=', 'Goal.id'),
        )
        .orderBy('ranks.value asc')
        .orderBy('updatedAt desc')
        .select(['id'])
        .execute();
    await updateGoalRank(goals.map((g, i) => ({ activityId, goalId: g.id, value: ranks[i] }))).execute();
};
