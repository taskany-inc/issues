import { useRouter as NextRouter } from 'next/router';

export const routes = {
    index: () => '/',
    goals: () => '/goals',
    goal: (id: string) => `/goals/${id}`,
    projects: () => '/projects',
    project: (id: string) => `/projects/${id}`,
    userSettings: () => '/users/settings',
    signIn: () => '/api/auth/signin',
};

export const useRouter = () => {
    const router = NextRouter();

    return {
        index: () => router.push(routes.index()),
        projects: () => router.push(routes.projects()),
        project: (id: string) => router.push(routes.project(id)),
        goals: () => router.push(routes.goals()),
        goal: (id: string) => router.push(routes.goal(id)),
        userSettings: () => router.push(routes.userSettings()),
    };
};
