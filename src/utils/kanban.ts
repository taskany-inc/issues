import { DashboardGoal } from '../../trpc/inferredTypes';

export const buildKanban = (goals: NonNullable<DashboardGoal>[]) => {
    return goals.reduce<Record<string, NonNullable<DashboardGoal>[]>>((acum, goal) => {
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
