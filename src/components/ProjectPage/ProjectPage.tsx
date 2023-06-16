/* eslint-disable react-hooks/rules-of-hooks */
import { MouseEventHandler, useCallback, useEffect, useState } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Button, nullable } from '@taskany/bricks';

import { refreshInterval } from '../../utils/config';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFilterResource } from '../../hooks/useFilterResource';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { routes } from '../../hooks/router';
import { ProjectPageLayout } from '../ProjectPageLayout/ProjectPageLayout';
import { Page, PageContent } from '../Page';
import { PageTitle } from '../PageTitle';
import { createFilterKeys } from '../../utils/hotkeys';
import { Nullish } from '../../types/void';
import { trpc } from '../../utils/trpcClient';
import { FilterById, GoalByIdReturnType, ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { ProjectListItemCollapsible } from '../ProjectListItem';

import { tr } from './ProjectPage.i18n';

const GoalPreview = dynamic(() => import('../GoalPreview/GoalPreview'));
const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

export const ProjectPage = ({ user, locale, ssrTime, params: { id } }: ExternalPageProps) => {
    const nextRouter = useNextRouter();
    const [preview, setPreview] = useState<GoalByIdReturnType | null>(null);
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);
    const { toggleFilterStar } = useFilterResource();

    const utils = trpc.useContext();
    const preset = trpc.filter.getById.useQuery(String(nextRouter.query.filter), {
        enabled: Boolean(nextRouter.query.filter),
    });
    const userFilters = trpc.filter.getUserFilters.useQuery();

    const {
        currentPreset,
        queryState,
        queryString,
        setPriorityFilter,
        setStateFilter,
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
        preset: preset?.data,
    });

    const project = trpc.project.getById.useQuery(id);
    const { data: projectDeepInfo, isLoading } = trpc.project.getDeepInfo.useQuery(
        {
            id,
            ...queryState,
        },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
        },
    );
    const shadowPreset = userFilters.data?.filter((f) => f.params === queryString)[0];

    const projectMap =
        // eslint-disable-next-line no-spaced-func
        (projectDeepInfo?.goals as NonNullable<GoalByIdReturnType>[])?.reduce<{
            [key: string]: {
                project: NonNullable<ProjectByIdReturnType>;
                goals: NonNullable<GoalByIdReturnType>[];
            };
        }>((r, g) => {
            if (!g.project) {
                return r;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const k = g.projectId!;

            if (!r[k]) {
                r[k] = {
                    project: g.project,
                    goals: [],
                };
            }

            r[k].goals.push(g);
            return r;
        }, Object.create(null)) || {};

    useEffect(() => {
        const isGoalDeletedAlready = preview && !projectDeepInfo?.goals?.some((g) => g.id === preview.id);

        if (isGoalDeletedAlready) setPreview(null);
    }, [projectDeepInfo, preview]);

    const onGoalPrewiewShow = useCallback(
        (goal: GoalByIdReturnType): MouseEventHandler<HTMLAnchorElement> =>
            (e) => {
                if (e.metaKey || e.ctrlKey) return;

                e.preventDefault();
                setPreview(goal);
            },
        [],
    );

    const onGoalPreviewDestroy = useCallback(() => {
        setPreview(null);
    }, []);

    const selectedGoalResolver = useCallback((id: string) => id === preview?.id, [preview]);

    useEffect(() => {
        if (project.data) {
            setCurrentProjectCache({
                id: project.data.id,
                title: project.data.title,
                description: project.data.description ?? undefined,
                flowId: project.data.flowId,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const pageTitle = tr
        .raw('title', {
            project: project.data?.title,
        })
        .join('');

    const defaultTitle = <PageTitle title={project.data?.title} />;
    const presetInfo =
        user.activityId !== currentPreset?.activityId
            ? `${tr('created by')} ${currentPreset?.activity?.user?.name}`
            : undefined;
    const presetTitle = <PageTitle title={project.data?.title} subtitle={currentPreset?.title} info={presetInfo} />;

    const onShadowPresetTitleClick = useCallback(() => {
        if (shadowPreset) setPreset(shadowPreset.id);
    }, [setPreset, shadowPreset]);
    const shadowPresetInfo =
        user.activityId !== shadowPreset?.activityId
            ? `${tr('created by')} ${shadowPreset?.activity?.user?.name}`
            : undefined;
    const shadowPresetTitle = (
        <PageTitle
            title={project.data?.title}
            subtitle={shadowPreset?.title}
            info={shadowPresetInfo}
            onClick={onShadowPresetTitleClick}
        />
    );
    // eslint-disable-next-line no-nested-ternary
    const title = currentPreset ? presetTitle : shadowPreset ? shadowPresetTitle : defaultTitle;
    const description =
        currentPreset && currentPreset.description ? currentPreset.description : project.data?.description;

    if (!project.data) return null;

    const fetchProjects = useCallback(
        (projectId: string): Promise<NonNullable<ProjectByIdReturnType>[] | null> => {
            // if (projectId !== project.data?.id) {
            //     return Promise.resolve(null);
            // }
            return Promise.resolve(
                project.data?.children
                    .map(({ id }) => {
                        return projectMap[id]?.project;
                    })
                    .filter((i) => i) || [],
            );
        },
        [projectMap, project],
    );

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <ProjectPageLayout
                actions
                id={project.data.id}
                title={title}
                description={description}
                starred={project.data._isStarred}
                watching={project.data._isWatching}
                stargizers={project.data._count.stargizers}
                owned={project.data._isOwner}
                parent={project.data.parent}
            >
                <FiltersPanel
                    loading={isLoading}
                    total={projectDeepInfo?.meta?.count}
                    counter={projectDeepInfo?.goals?.length}
                    queryState={queryState}
                    queryString={queryString}
                    issuers={projectDeepInfo?.meta?.issuers}
                    owners={projectDeepInfo?.meta?.owners}
                    participants={projectDeepInfo?.meta?.participants}
                    priorities={projectDeepInfo?.meta?.priority}
                    projects={projectDeepInfo?.meta?.projects}
                    preset={currentPreset}
                    presets={userFilters.data}
                    tags={projectDeepInfo?.meta?.tags}
                    states={projectDeepInfo?.meta?.states}
                    estimates={projectDeepInfo?.meta?.estimates}
                    onSearchChange={setFulltextFilter}
                    onIssuerChange={setIssuerFilter}
                    onOwnerChange={setOwnerFilter}
                    onParticipantChange={setParticipantFilter}
                    onProjectChange={setProjectFilter}
                    onStateChange={setStateFilter}
                    onTagChange={setTagsFilter}
                    onEstimateChange={setEstimateFilter}
                    onPriorityChange={setPriorityFilter}
                    onStarredChange={setStarredFilter}
                    onWatchingChange={setWatchingFilter}
                    onPresetChange={setPreset}
                    onFilterStar={onFilterStar}
                    onSortChange={setSortFilter}
                >
                    {Boolean(queryString) && <Button text={tr('Reset')} onClick={resetQueryState} />}
                </FiltersPanel>

                <PageContent>
                    <ProjectListItemCollapsible
                        key={project.data.id}
                        id={project.data.id}
                        href={routes.project(project.data.id)}
                        title={project.data.title}
                        owner={project.data?.activity}
                        participants={project.data?.participants}
                        starred={project.data?._isStarred}
                        watching={project.data?._isWatching}
                        fetchProjects={fetchProjects}
                        onTagClick={setTagsFilterOutside}
                        onClickProvider={onGoalPrewiewShow}
                        selectedResolver={selectedGoalResolver}
                        queryState={queryState}
                    />
                </PageContent>

                {nullable(preview, (p) => (
                    <GoalPreview preview={p} onClose={onGoalPreviewDestroy} onDelete={onGoalPreviewDestroy} />
                ))}

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
            </ProjectPageLayout>
        </Page>
    );
};
