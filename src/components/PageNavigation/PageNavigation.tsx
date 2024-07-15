import { FC, useMemo } from 'react';
import { IconBellOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';
import { useRouter } from 'next/router';

import {
    Navigation,
    NavigationItem,
    NavigationSection,
    NavigationSidebar,
    NavigationSidebarContent,
    NavigationSidebarHeader,
    NavigationSidebarLogo,
    NavigationSidebarTitle,
} from '../NavigationSidebar/NavigationSidebar';
import { NavigationSidebarActionButton } from '../NavigationSidebarActionButton/NavigationSidebarActionButton';
import { routes } from '../../hooks/router';
import { refreshInterval } from '../../utils/config';
import { trpc } from '../../utils/trpcClient';
import { header, headerMenuExplore, headerMenuGoals } from '../../utils/domObjects';

import { tr } from './PageNavigation.i18n';

interface AppNavigationProps {
    logo?: string;
}

export const PageNavigation: FC<AppNavigationProps> = ({ logo }) => {
    const nextRouter = useRouter();
    const activeRoute = nextRouter.asPath.split('?')[0];

    const { data: projects = [] } = trpc.v2.project.userProjects.useQuery({});

    const { data: presets = [] } = trpc.filter.getUserFilters.useQuery(undefined, {
        keepPreviousData: true,
        staleTime: refreshInterval,
    });

    const { goalsRoutes, presetRoutes, projectsRoutes, isPresetActive } = useMemo(() => {
        const presetRoutes = presets.map((preset) => ({
            title: preset.title,
            href: routes.goals(preset.id),
        }));

        return {
            goalsRoutes: [
                {
                    title: tr('My goals'),
                    href: routes.index(),
                    attrs: headerMenuGoals.attr,
                },
                {
                    title: tr('Starred'),
                    href: routes.goalsStarred(),
                },
                {
                    title: tr('Watching'),
                    href: routes.goalsWatching(),
                },
                {
                    title: tr('All goals'),
                    href: routes.goals(),
                    attrs: headerMenuExplore.attr,
                },
            ],
            presetRoutes,
            projectsRoutes: [
                ...projects.map((p) => ({
                    title: p.title,
                    href: routes.project(p.id),
                })),
                {
                    title: tr('Starred'),
                    href: routes.exploreProjectsStarred(),
                },
                {
                    title: tr('All projects'),
                    href: routes.exploreProjects(),
                },
            ],
            isPresetActive: presetRoutes.some((item) => item.href === nextRouter.asPath),
        };
    }, [projects, presets, nextRouter]);

    return (
        <NavigationSidebar {...header.attr}>
            <NavigationSidebarHeader>
                <NavigationSidebarLogo logo={logo} href={routes.index()} />
                <NavigationSidebarTitle>{tr('Goals')}</NavigationSidebarTitle>
                <IconBellOutline size="s" />
            </NavigationSidebarHeader>
            <NavigationSidebarContent>
                <NavigationSidebarActionButton />
                <Navigation>
                    <NavigationSection title={tr('Goals')}>
                        {goalsRoutes.map(({ title, href }) => (
                            <NavigationItem key={href} selected={!isPresetActive && activeRoute === href} href={href}>
                                {title}
                            </NavigationItem>
                        ))}
                    </NavigationSection>

                    {nullable(presetRoutes, () => (
                        <NavigationSection title={tr('Preset')}>
                            {presetRoutes.map(({ title, href }) => (
                                <NavigationItem key={href} selected={nextRouter.asPath === href} href={href}>
                                    {title}
                                </NavigationItem>
                            ))}
                        </NavigationSection>
                    ))}

                    <NavigationSection title={tr('Projects')}>
                        {projectsRoutes.map(({ title, href }) => (
                            <NavigationItem key={href} selected={activeRoute === href} href={href}>
                                {title}
                            </NavigationItem>
                        ))}
                    </NavigationSection>
                </Navigation>
            </NavigationSidebarContent>
        </NavigationSidebar>
    );
};
