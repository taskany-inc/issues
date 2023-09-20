import { MouseEventHandler, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Button, nullable } from '@taskany/bricks';

import { PageContent, Page } from '../Page';
import { refreshInterval } from '../../utils/config';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFilterResource } from '../../hooks/useFilterResource';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { createFilterKeys } from '../../utils/hotkeys';
import { Nullish } from '../../types/void';
import { trpc } from '../../utils/trpcClient';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { FilterById, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { ProjectListItemConnected } from '../ProjectListItemConnected';
import { PageTitlePreset } from '../PageTitlePreset/PageTitlePreset';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { LoadMoreButton } from '../LoadMoreButton/LoadMoreButton';
import { CommonHeader } from '../CommonHeader';
import { useProjectResource } from '../../hooks/useProjectResource';
import { WatchButton } from '../WatchButton/WatchButton';
import { StarButton } from '../StarButton/StarButton';
import { ProjectTabsMenu } from '../ProjectTabsMenu/ProjectTabsMenu';

import { tr } from './ProjectsPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

export const projectsSize = 20;

export const ProjectsPage = ({ user, ssrTime, params: { id }, defaultPresetFallback }: ExternalPageProps) => {
    const nextRouter = useNextRouter();
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    const setCurrentProjectCacheRef = useRef(setCurrentProjectCache);
    const { toggleFilterStar } = useFilterResource();

    const utils = trpc.useContext();

    const { preset, shadowPreset, userFilters } = useFiltersPreset({ defaultPresetFallback });

    const {
        currentPreset,
        queryState,
        queryString,
        setPriorityFilter,
        setStateFilter,
        setStateTypeFilter,
        setTagsFilter,
        setTagsFilterOutside,
        setEstimateFilter,
        setIssuerFilter,
        setOwnerFilter,
        setParticipantFilter,
        setProjectFilter,
        setStarredFilter,
        setWatchingFilter,
        setSortFilter,
        setFulltextFilter,
        resetQueryState,
        setPreset,
    } = useUrlFilterParams({
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

    const {
        data,
        isLoading: isLoadingAllProjects,
        fetchNextPage,
        hasNextPage,
    } = trpc.project.getAll.useInfiniteQuery(
        {
            limit: projectsSize,
            firstLevel: true,
            goalsQuery: queryState,
        },
        {
            getNextPageParam: (p) => p.nextCursor,
            keepPreviousData: true,
            staleTime: refreshInterval,
            enabled: !id,
        },
    );

    const [pages, projects] = useMemo(() => {
        const pgs = data?.pages || [];
        return [pgs, pgs[0]?.projects];
    }, [data?.pages]);

    const projectsOnScreen = useMemo(
        () =>
            project
                ? [project]
                : pages.reduce<typeof projects>((acc, cur) => {
                      acc.push(...cur.projects);
                      return acc;
                  }, []),
        [pages, project],
    );

    const { preview, setPreview } = useGoalPreview();

    const onGoalPrewiewShow = useCallback(
        (goal: GoalByIdReturnType): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey || !goal?._shortId) return;

                e.preventDefault();
                setPreview(goal._shortId, goal);
            },
        [setPreview],
    );

    const selectedGoalResolver = useCallback((id: string) => id === preview?.id, [preview]);

    useEffect(() => {
        if (!project) return;

        setCurrentProjectCacheRef.current({
            id: project.id,
            title: project.title,
            description: project.description ?? undefined,
            flowId: project.flowId,
        });
    }, [project]);

    useWillUnmount(() => {
        setCurrentProjectCache(null);
    });

    const onFilterStar = useCallback(async () => {
        if (currentPreset) {
            if (currentPreset._isOwner) {
                dispatchModalEvent(ModalEvent.FilterDeleteModal)();
            } else {
                await toggleFilterStar({
                    id: currentPreset.id,
                    direction: !currentPreset._isStarred,
                });
                await utils.filter.getById.invalidate();
            }
        } else {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
        }
    }, [currentPreset, toggleFilterStar, utils]);

    const onFilterCreated = useCallback(
        (data: Nullish<FilterById>) => {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
            setPreset(data.id);
        },
        [setPreset],
    );

    const onFilterDeleteCanceled = useCallback(() => {
        dispatchModalEvent(ModalEvent.FilterDeleteModal)();
    }, []);

    const onFilterDeleted = useCallback(
        (filter: FilterById) => {
            nextRouter.push(`${nextRouter.route}?${filter.params}`);
        },
        [nextRouter],
    );

    const pageTitle = project?.title
        ? tr
              .raw('title', {
                  project: project?.title,
              })
              .join('')
        : tr('projects title');

    const title = (
        <PageTitlePreset
            activityId={user.activityId}
            currentPresetActivityId={currentPreset?.activityId}
            currentPresetActivityUserName={currentPreset?.activity?.user?.name}
            currentPresetTitle={currentPreset?.title}
            shadowPresetActivityId={shadowPreset?.activityId}
            shadowPresetActivityUserName={shadowPreset?.activity?.user?.name}
            shadowPresetId={shadowPreset?.id}
            shadowPresetTitle={shadowPreset?.title}
            title={project?.title || tr('Projects')}
            setPreset={setPreset}
        />
    );
    const description =
        currentPreset && currentPreset.description
            ? currentPreset.description
            : project?.description || tr('description');

    const { toggleProjectWatching, toggleProjectStar } = useProjectResource(id);

    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle}>
            <CommonHeader
                title={title}
                description={description}
                actions={nullable(id, () => (
                    <>
                        <WatchButton watcher={project?._isWatching} onToggle={toggleProjectWatching} />
                        <StarButton
                            stargizer={project?._isStarred}
                            count={project?._count.stargizers}
                            onToggle={toggleProjectStar}
                        />
                    </>
                ))}
            >
                <ProjectTabsMenu id={id} />
            </CommonHeader>

            <FiltersPanel
                total={projectDeepInfo?.meta?.count}
                counter={projectDeepInfo?.goals?.length}
                loading={id ? isLoadingDeepInfoProject : isLoadingAllProjects}
                queryState={queryState}
                queryString={queryString}
                preset={currentPreset}
                presets={userFilters}
                onSearchChange={setFulltextFilter}
                onIssuerChange={setIssuerFilter}
                onOwnerChange={setOwnerFilter}
                onParticipantChange={setParticipantFilter}
                onProjectChange={setProjectFilter}
                onStateChange={setStateFilter}
                onStateTypeChange={setStateTypeFilter}
                onTagChange={setTagsFilter}
                onEstimateChange={setEstimateFilter}
                onPriorityChange={setPriorityFilter}
                onStarredChange={setStarredFilter}
                onWatchingChange={setWatchingFilter}
                onPresetChange={setPreset}
                onFilterStar={onFilterStar}
                onSortChange={setSortFilter}
            >
                {(Boolean(queryString) || preset) && <Button text={tr('Reset')} onClick={resetQueryState} />}
            </FiltersPanel>

            <PageContent>
                {projectsOnScreen.map((project) => (
                    <ProjectListItemConnected
                        key={project.id}
                        project={project}
                        onTagClick={setTagsFilterOutside}
                        onClickProvider={onGoalPrewiewShow}
                        selectedResolver={selectedGoalResolver}
                        queryState={queryState}
                        collapsed={!id}
                        hasLink={!id}
                    />
                ))}

                {nullable(hasNextPage, () => (
                    <LoadMoreButton onClick={() => fetchNextPage()} />
                ))}
            </PageContent>

            {nullable(queryString, (params) => (
                <ModalOnEvent event={ModalEvent.FilterCreateModal} hotkeys={createFilterKeys}>
                    <FilterCreateForm mode="User" params={params} onSubmit={onFilterCreated} />
                </ModalOnEvent>
            ))}

            {nullable(currentPreset, (cP) => (
                <ModalOnEvent view="warn" event={ModalEvent.FilterDeleteModal}>
                    <FilterDeleteForm preset={cP} onSubmit={onFilterDeleted} onCancel={onFilterDeleteCanceled} />
                </ModalOnEvent>
            ))}
        </Page>
    );
};
