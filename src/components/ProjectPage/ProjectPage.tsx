import { useCallback, useEffect, useMemo } from 'react';
import NextLink from 'next/link';
import { nullable } from '@taskany/bricks';
import { ListView, Breadcrumb, Breadcrumbs, Link } from '@taskany/bricks/harmony';

import { Page } from '../Page/Page';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { refreshInterval } from '../../utils/config';
import { routes } from '../../hooks/router';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { trpc } from '../../utils/trpcClient';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { ProjectListItemConnected } from '../ProjectListItemConnected';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { ProjectPageTabs } from '../ProjectPageTabs/ProjectPageTabs';
import { FiltersBarItem } from '../FiltersBar/FiltersBar';
import { PresetModals } from '../PresetModals';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { ProjectContext } from '../ProjectContext/ProjectContext';

import { tr } from './ProjectPage.i18n';
import s from './ProjectPage.module.css';

export const projectsSize = 20;

export const ProjectPage = ({ user, ssrTime, params: { id }, defaultPresetFallback }: ExternalPageProps) => {
    const utils = trpc.useContext();

    const { preset } = useFiltersPreset({ defaultPresetFallback });

    const { queryState, setTagsFilterOutside } = useUrlFilterParams({
        preset,
    });

    const { data: project } = trpc.project.getById.useQuery(
        {
            id,
            goalsQuery: queryState,
        },
        { enabled: Boolean(id) },
    );

    const { data: projectDeepInfo, isLoading: isLoadingDeepInfoProject } = trpc.project.getDeepInfo.useQuery(
        {
            id,
            goalsQuery: queryState,
        },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
            enabled: Boolean(id),
        },
    );

    const { setPreview, on } = useGoalPreview();

    useEffect(() => {
        const unsubUpdate = on('on:goal:update', () => {
            utils.project.getById.invalidate();
            utils.project.getDeepInfo.invalidate();
        });
        const unsubDelete = on('on:goal:delete', () => {
            utils.project.getById.invalidate();
            utils.project.getDeepInfo.invalidate();
        });

        return () => {
            unsubUpdate();
            unsubDelete();
        };
    }, [on, utils.project.getDeepInfo, utils.project.getById]);

    const handleItemEnter = useCallback(
        (goal: NonNullable<GoalByIdReturnType>) => {
            setPreview(goal._shortId, goal);
        },
        [setPreview],
    );

    const ctx = useMemo(() => ({ project: project ?? null }), [project]);

    return (
        <ProjectContext.Provider value={ctx}>
            <Page
                user={user}
                ssrTime={ssrTime}
                title={tr
                    .raw('title', {
                        project: project?.title,
                    })
                    .join('')}
                header={
                    <FiltersPanel
                        title={project?.title || tr('Projects')}
                        total={projectDeepInfo?.meta?.count}
                        counter={projectDeepInfo?.goals?.length}
                        filterPreset={preset}
                        loading={isLoadingDeepInfoProject}
                    >
                        <FiltersBarItem>
                            <ProjectPageTabs id={id} editable={project?._isEditable} />
                        </FiltersBarItem>
                    </FiltersPanel>
                }
            >
                {nullable(project?.parent, (p) => (
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

                <ListView onKeyboardClick={handleItemEnter}>
                    {nullable(project, (p) => (
                        <ProjectListItemConnected
                            key={p.id}
                            visible
                            editable
                            project={p}
                            onTagClick={setTagsFilterOutside}
                            queryState={queryState}
                        />
                    ))}
                </ListView>

                <PresetModals preset={preset} />
            </Page>
        </ProjectContext.Provider>
    );
};
