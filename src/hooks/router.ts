import { useRouter as NextRouter } from 'next/router';

export const routes = {
    index: () => '/',
    goals: () => `/goals`,
    createGoal: () => '/goals/new',
    goal: (id: string) => `/goals/${id}`,
    editGoal: (id: string) => `/goals/${id}/edit`,
    createTeam: () => '/teams/new',
    teams: () => `/teams`,
    team: (id: string) => `/teams/${id}`,
    editTeam: (id: string) => `/teams/${id}/edit`,
};

export const useRouter = () => {
    const router = NextRouter();

    return {
        index: () => router.push(routes.index()),
        teams: () => router.push(routes.teams()),
        team: (id: string) => router.push(routes.team(id)),
        createTeam: () => router.push(routes.createTeam()),
        editTeam: (id: string) => router.push(routes.editTeam(id)),
        goals: () => router.push(routes.goals()),
        goal: (id: string) => router.push(routes.goal(id)),
        createGoal: () => router.push(routes.createGoal()),
        editGoal: (id: string) => router.push(routes.editGoal(id)),
    };
};
