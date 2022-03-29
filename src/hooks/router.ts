import { useRouter as NextRouter } from 'next/router';

export const routes = {
    index: () => '/',
    goals: () => `/goals`,
    createGoal: () => '/goals/new',
    goal: (id: string) => `/goals/${id}`,
    editGoal: (id: string) => `/goals/${id}/edit`,
    createGroup: () => '/groups/new',
    group: (id: string) => `/groups/${id}`,
    editGroup: (id: string) => `/groups/${id}/edit`,
};

export const useRouter = () => {
    const router = NextRouter();

    return {
        index: () => router.push(routes.index()),
        group: (id: string) => router.push(routes.group(id)),
        createGroup: () => router.push(routes.createGroup()),
        editGroup: (id: string) => router.push(routes.editGroup(id)),
        goal: (id: string) => router.push(routes.goal(id)),
        createGoal: () => router.push(routes.createGoal()),
        editGoal: (id: string) => router.push(routes.editGoal(id)),
    };
};
