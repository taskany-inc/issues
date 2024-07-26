import { FC, useMemo } from 'react';
import { IconBellOutline } from '@taskany/icons';
import {
    Navigation,
    NavigationItem,
    NavigationSection,
    NavigationSidebar,
    NavigationSidebarContent,
    NavigationSidebarHeader,
    NavigationSidebarTitle,
    TaskanyLogo,
} from '@taskany/bricks/harmony';
import { useRouter } from 'next/router';
import { nullable } from '@taskany/bricks';
import NextLink from 'next/link';

import { NavigationSidebarActionButton } from '../NavigationSidebarActionButton/NavigationSidebarActionButton';
import { routes } from '../../hooks/router';
import { refreshInterval } from '../../utils/config';
import { trpc } from '../../utils/trpcClient';
import { header, headerMenuExplore, headerMenuGoals } from '../../utils/domObjects';

import { tr } from './PageNavigation.i18n';
import s from './PageNavigation.module.css';

interface PageNavigationItemProps {
    href: string;
    title: string;
    selected: boolean;
}

const PageNavigationItem: FC<PageNavigationItemProps> = ({ href, selected, title }) => (
    <div key={href} className={s.PageNavigationItemLink}>
        <NextLink href={href} legacyBehavior>
            <NavigationItem selected={selected} href={href}>
                {title}
            </NavigationItem>
        </NextLink>
    </div>
);

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
                <NextLink href={routes.index()} passHref className={s.PageNavigationLogo}>
                    <TaskanyLogo src={logo} size="m" />
                </NextLink>
                <NavigationSidebarTitle>{tr('Goals')}</NavigationSidebarTitle>
                <IconBellOutline size="s" />
            </NavigationSidebarHeader>
            <NavigationSidebarContent>
                <NavigationSidebarActionButton />
                <Navigation>
                    <NavigationSection title={tr('Goals')}>
                        {goalsRoutes.map(({ title, href }) => (
                            <PageNavigationItem
                                key={href}
                                selected={!isPresetActive && activeRoute === href}
                                href={href}
                                title={title}
                            />
                        ))}
                    </NavigationSection>

                    {nullable(presetRoutes, () => (
                        <NavigationSection title={tr('Preset')}>
                            {presetRoutes.map(({ title, href }) => (
                                <PageNavigationItem
                                    key={href}
                                    selected={nextRouter.asPath === href}
                                    href={href}
                                    title={title}
                                />
                            ))}
                        </NavigationSection>
                    ))}

                    <NavigationSection title={tr('Projects')}>
                        {projectsRoutes.map(({ title, href }) => (
                            <PageNavigationItem key={href} selected={activeRoute === href} href={href} title={title} />
                        ))}
                    </NavigationSection>
                </Navigation>
            </NavigationSidebarContent>
        </NavigationSidebar>
    );
};
