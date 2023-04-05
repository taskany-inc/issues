import { useRouter as NextRouter } from 'next/router';

import { AvailableHelpPages } from '../types/@generated/help';
import { TLocale } from '../i18n/getLang';

export const routes = {
    index: () => '/',

    teams: () => '/teams',
    team: (id: string) => `/teams/${id}`,
    teamGoals: (id: string) => `/teams/${id}/goals`,
    teamSettings: (id: string) => `/teams/${id}/settings`,

    project: (id: string) => `/projects/${id}`,
    projectSettings: (id: string) => `/projects/${id}/settings`,

    goals: () => '/goals',
    goal: (id: string) => `/goals/${id}`,

    signIn: () => '/api/auth/signin',
    userSettings: () => '/users/settings',

    exploreTeams: () => '/explore/teams',
    exploreProjects: () => '/explore/projects',
    exploreGoals: () => '/explore/goals',

    help: (locale: TLocale, slug: AvailableHelpPages) => `/help/${locale}/${slug}`,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useRouter = (): Record<keyof typeof routes, any> => {
    const router = NextRouter();

    return {
        index: () => router.push(routes.index()),

        teams: () => router.push(routes.teams()),
        team: (id: string) => router.push(routes.team(id)),
        teamGoals: (id: string) => router.push(routes.teamGoals(id)),
        teamSettings: (id: string) => router.push(routes.teamSettings(id)),

        project: (id: string) => router.push(routes.project(id)),
        projectSettings: (id: string) => router.push(routes.projectSettings(id)),

        goals: () => router.push(routes.goals()),
        goal: (id: string) => router.push(routes.goal(id)),

        signIn: () => router.push(routes.signIn()),
        userSettings: () => router.push(routes.userSettings()),

        exploreTeams: () => router.push(routes.exploreTeams()),
        exploreProjects: () => router.push(routes.exploreProjects()),
        exploreGoals: () => router.push(routes.exploreGoals()),

        help: (locale: TLocale, slug: AvailableHelpPages) => router.push(locale, slug),
    };
};
