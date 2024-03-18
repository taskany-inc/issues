import { useCallback, useEffect } from 'react';
import { ListView, nullable } from '@taskany/bricks';

import { Page } from '../Page/Page';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { refreshInterval } from '../../utils/config';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { trpc } from '../../utils/trpcClient';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { ProjectListItemConnected } from '../ProjectListItemConnected';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { ProjectPageTabs } from '../ProjectPageTabs/ProjectPageTabs';
import { FiltersBarItem } from '../FiltersBar/FiltersBar';
import { PresetModals } from '../PresetModals';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';

import { tr } from './ProjectPage.i18n';

export const projectsSize = 20;

export const ProjectPage = ({ user, ssrTime, params: { id }, defaultPresetFallback }: ExternalPageProps) => {
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

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

    useEffect(() => {
        if (!project || project.personal) return;

        setCurrentProjectCache({
            id: project.id,
            title: project.title,
            description: project.description ?? undefined,
            flowId: project.flowId,
        });
    }, [project, setCurrentProjectCache]);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const handleItemEnter = useCallback(
        (goal: NonNullable<GoalByIdReturnType>) => {
            setPreview(goal._shortId, goal);
        },
        [setPreview],
    );

    return (
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
            <ListView onKeyboardClick={handleItemEnter}>
                {nullable(project, (p) => (
                    <ProjectListItemConnected
                        key={p.id}
                        visible
                        project={p}
                        onTagClick={setTagsFilterOutside}
                        queryState={queryState}
                    />
                ))}
            </ListView>
            <PresetModals preset={preset} />
        </Page>
    );
};
