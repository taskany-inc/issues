import { useCallback, useDeferredValue, useEffect, useMemo } from 'react';
import NextLink from 'next/link';
import { nullable } from '@taskany/bricks';
import { ListView, Breadcrumb, Breadcrumbs, Link, FiltersBarItem } from '@taskany/bricks/harmony';

import { Page } from '../Page/Page';
import { GoalByIdReturnType, ProjectChildrenTree } from '../../../trpc/inferredTypes';
import { routes } from '../../hooks/router';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { trpc } from '../../utils/trpcClient';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { ProjectListItemConnected } from '../ProjectListItemConnected/ProjectListItemConnected';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { ProjectPageTabs } from '../ProjectPageTabs/ProjectPageTabs';
import { PresetModals } from '../PresetModals';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { ProjectContext } from '../ProjectContext/ProjectContext';

import { tr } from './ProjectPage.i18n';
import s from './ProjectPage.module.css';

export const projectsSize = 20;

const countAvailableGoals = (subTree?: ProjectChildrenTree[string] | null) => {
    let count = 0;
    if (subTree) {
        const nodes = [subTree.children];
        let i = 0;
        let current = nodes[0];
        while (current) {
            const keys = Object.keys(current);
            for (const key of keys) {
                count += current[key].count || 0;

                if (current[key].children) {
                    nodes.push(current[key].children);
                }
            }
            i++;
            current = nodes[i];
        }
    }

    return count;
};

export const ProjectPage = ({ user, ssrTime, params: { id }, defaultPresetFallback }: ExternalPageProps) => {
    const utils = trpc.useContext();

    const { preset } = useFiltersPreset({ defaultPresetFallback });

    const { queryState, view } = useUrlFilterParams({
        preset,
    });

    const [projectQuery, projectTreeQuery] = trpc.useQueries((ctx) => [
        ctx.v2.project.getById({ id }, { enabled: Boolean(id) }),
        ctx.v2.project.getProjectChildrenTree(
            {
                id,
                goalsQuery: queryState,
            },
            {
                keepPreviousData: true,
                staleTime: Infinity,
                enabled: Boolean(id),
            },
        ),
    ]);

    const wholeGoalCountValue = useDeferredValue(countAvailableGoals(projectTreeQuery.data?.[id]));

    const { setPreview, on } = useGoalPreview();

    const invalidateFnsCallback = useCallback(() => {
        utils.v2.project.getById.invalidate();
        utils.v2.project.getProjectChildrenTree.invalidate();
    }, [utils.v2.project.getProjectChildrenTree, utils.v2.project.getById]);

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', invalidateFnsCallback);
        const unsubDelete = on('on:goal:delete', invalidateFnsCallback);

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, invalidateFnsCallback]);

    const handleItemEnter = useCallback(
        (goal: NonNullable<GoalByIdReturnType>) => {
            setPreview(goal._shortId, goal);
        },
        [setPreview],
    );

    const ctx = useMemo(() => ({ project: projectQuery.data ?? null }), [projectQuery.data]);

    return (
        <ProjectContext.Provider value={ctx}>
            <Page
                user={user}
                ssrTime={ssrTime}
                scrollerShadow={view === 'kanban' ? 70 : 0}
                title={tr
                    .raw('title', {
                        project: ctx.project?.title,
                    })
                    .join('')}
                header={
                    <FiltersPanel
                        title={ctx.project?.title || tr('Projects')}
                        counter={ctx.project?._count?.goals ?? 0}
                        total={wholeGoalCountValue}
                        filterPreset={preset}
                        enableLayoutToggle
                        enableHideProjectToggle
                    >
                        <FiltersBarItem>
                            <ProjectPageTabs id={id} editable={ctx.project?._isEditable} />
                        </FiltersBarItem>
                    </FiltersPanel>
                }
            >
                {nullable(ctx.project?.parent, (p) => (
                    <Breadcrumbs className={s.Breadcrumbs}>
                        {p.map((item) => (
                            <Breadcrumb key={item.id}>
                                <NextLink href={routes.project(item.id)} passHref legacyBehavior>
                                    <Link>{item.title}</Link>
                                </NextLink>
                            </Breadcrumb>
                        ))}
                    </Breadcrumbs>
                ))}

                {nullable(ctx.project, (p) => (
                    <ListView onKeyboardClick={handleItemEnter}>
                        <ProjectListItemConnected
                            key={p.id}
                            mainProject
                            visible
                            project={p}
                            filterPreset={preset}
                            subTree={projectTreeQuery.data?.[p.id]}
                        />
                    </ListView>
                ))}

                <PresetModals preset={preset} />
            </Page>
        </ProjectContext.Provider>
    );
};
