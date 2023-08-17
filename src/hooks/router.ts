import { useRouter as NextRouter } from 'next/router';

import { AvailableHelpPages } from '../types/help';
import { TLocale } from '../utils/getLang';

export const routes = {
    index: () => '/',

    projects: () => '/projects',
    project: (id: string) => `/projects/${id}`,
    projectSettings: (id: string) => `/projects/${id}/settings`,

    goals: () => '/goals',
    goal: (shortId: string) => `/goals/${shortId}`,

    signIn: () => '/api/auth/signin',
    userSettings: () => '/users/settings',

    exploreProjects: () => '/explore/projects',
    exploreTopProjects: () => '/explore/top',
    exploreGoals: () => '/explore/goals',

    help: (slug: AvailableHelpPages) => `/help/${slug}`,
    whatsnew: (release: string, locale: TLocale) => `/whatsnew/${release}/${locale}`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useRouter = () => {
    const router = NextRouter();

    return {
        index: () => router.push(routes.index()),

        project: (id: string) => router.push(routes.project(id)),
        projectSettings: (id: string) => router.push(routes.projectSettings(id)),

        goals: () => router.push(routes.goals()),
        goal: (shortId: string) => router.push(routes.goal(shortId)),

        signIn: () => router.push(routes.signIn()),
        userSettings: () => router.push(routes.userSettings()),

        exploreProjects: () => router.push(routes.exploreProjects()),
        exploreTopProjects: () => router.push(routes.exploreTopProjects()),
        exploreGoals: () => router.push(routes.exploreGoals()),

        help: (slug: AvailableHelpPages) => router.push(slug),
    };
};
