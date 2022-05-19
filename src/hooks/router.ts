import { useRouter as NextRouter } from 'next/router';

export const routes = {
    index: () => '/',
    goals: () => '/goals',
    createGoal: () => '/goals/new',
    goal: (id: string) => `/goals/${id}`,
    editGoal: (id: string) => `/goals/${id}/edit`,
    createProject: () => '/projects/new',
    projects: () => '/projects',
    project: (id: string) => `/projects/${id}`,
    editProject: (id: string) => `/projects/${id}/edit`,
    inviteUsers: () => '/users/invite',
    signIn: () => '/api/auth/signin',
};

export const useRouter = () => {
    const router = NextRouter();

    return {
        index: () => router.push(routes.index()),
        projects: () => router.push(routes.projects()),
        project: (id: string) => router.push(routes.project(id)),
        createProject: () => router.push(routes.createProject()),
        editProject: (id: string) => router.push(routes.editProject(id)),
        goals: () => router.push(routes.goals()),
        goal: (id: string) => router.push(routes.goal(id)),
        createGoal: () => router.push(routes.createGoal()),
        editGoal: (id: string) => router.push(routes.editGoal(id)),
        inviteUsers: () => router.push(routes.inviteUsers()),
    };
};
