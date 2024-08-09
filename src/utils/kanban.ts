import { DashboardGoal, DashboardGoalV2 } from '../../trpc/inferredTypes';

export const buildKanban = (goals: NonNullable<DashboardGoal | DashboardGoalV2>[]) => {
    return goals.reduce<Record<string, NonNullable<DashboardGoal | DashboardGoalV2>[]>>((acum, goal) => {
        const stateKey = goal.stateId;

        if (!stateKey) {
            return acum;
        }

        if (!acum[stateKey]) {
            acum[stateKey] = [];
        }

        acum[stateKey].push(goal);

        return acum;
    }, {});
};
