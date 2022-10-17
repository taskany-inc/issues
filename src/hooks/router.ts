import { useRouter as NextRouter } from 'next/router';

import { AvailableHelpPages } from '../types/@generated/help';
import { TLocale } from '../types/locale';

export const routes = {
    index: () => '/',
    goals: () => '/goals',
    goal: (id: string) => `/goals/${id}`,
    project: (id: string) => `/projects/${id}`,
    projectSettings: (id: string) => `/projects/${id}/settings`,
    userSettings: () => '/users/settings',
    signIn: () => '/api/auth/signin',
    help: (locale: TLocale, slug: AvailableHelpPages) => `/help/${locale}/${slug}`,
    exploreProjects: () => '/explore/projects',
};

export const useRouter = () => {
    const router = NextRouter();

    return {
        index: () => router.push(routes.index()),
        project: (id: string) => router.push(routes.project(id)),
        projectSettings: (id: string) => router.push(routes.projectSettings(id)),
        goals: () => router.push(routes.goals()),
        goal: (id: string) => router.push(routes.goal(id)),
        userSettings: () => router.push(routes.userSettings()),
        exploreProjects: () => router.push(routes.exploreProjects()),
    };
};
