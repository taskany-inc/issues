import { MouseEventHandler, useCallback, useEffect, useMemo } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import NextLink from 'next/link';
import { TabsMenu, TabsMenuItem, nullable } from '@taskany/bricks';

import { Page } from '../Page';
import { refreshInterval } from '../../utils/config';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useWillUnmount } from '../../hooks/useWillUnmount';
import { trpc } from '../../utils/trpcClient';
import { useFiltersPreset } from '../../hooks/useFiltersPreset';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { ProjectListItemConnected } from '../ProjectListItemConnected';
import { PageTitlePreset } from '../PageTitlePreset/PageTitlePreset';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { CommonHeader } from '../CommonHeader';
import { useProjectResource } from '../../hooks/useProjectResource';
import { WatchButton } from '../WatchButton/WatchButton';
import { StarButton } from '../StarButton/StarButton';
import { routes } from '../../hooks/router';
import { pageActiveTabItem, pageTabs } from '../../utils/domObjects';
import { safeGetUserName } from '../../utils/getUserName';
import { FilteredPage } from '../FilteredPage/FilteredPage';
import { IssueParent } from '../IssueParent';

import { tr } from './ProjectPage.i18n';

export const projectsSize = 20;

export const ProjectPage = ({ user, ssrTime, params: { id }, defaultPresetFallback }: ExternalPageProps) => {
    const nextRouter = useNextRouter();
    const [, setCurrentProjectCache] = useLocalStorage('currentProjectCache', null);

    const utils = trpc.useContext();

    const { preset, shadowPreset, userFilters } = useFiltersPreset({ defaultPresetFallback });

    const { currentPreset, queryState, setTagsFilterOutside, setPreset } = useUrlFilterParams({
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

    const onFilterStar = useCallback(async () => {
        await utils.filter.getById.invalidate();
    }, [utils]);

    const title = (
        <PageTitlePreset
            activityId={user.activityId}
            currentPresetActivityId={currentPreset?.activityId}
            currentPresetActivityUserName={safeGetUserName(currentPreset?.activity)}
            currentPresetTitle={currentPreset?.title}
            shadowPresetActivityId={shadowPreset?.activityId}
            shadowPresetActivityUserName={safeGetUserName(shadowPreset?.activity)}
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

    const tabsMenuOptions: Array<[string, string, boolean]> = useMemo(
        () => [
            [tr('Goals'), routes.project(id), false],
            [tr('Settings'), routes.projectSettings(id), true],
        ],
        [id],
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
        >
            <CommonHeader
                title={title}
                description={description}
                preTitle={nullable(project?.parent, (parent) => (
                    <IssueParent parent={parent} mode="compact" />
                ))}
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
                <TabsMenu {...pageTabs.attr}>
                    {tabsMenuOptions.map(([title, href, ownerOnly]) =>
                        nullable(ownerOnly ? project?._isEditable : true, () => {
                            const isActive = nextRouter.asPath.split('?')[0] === href;
                            const activeAttrs = isActive ? pageActiveTabItem.attr : null;

                            return (
                                <NextLink key={title} href={href} passHref legacyBehavior>
                                    <TabsMenuItem active={isActive} {...activeAttrs}>
                                        {title}
                                    </TabsMenuItem>
                                </NextLink>
                            );
                        }),
                    )}
                </TabsMenu>
            </CommonHeader>
            <FilteredPage
                total={projectDeepInfo?.meta?.count}
                counter={projectDeepInfo?.goals?.length}
                filterPreset={currentPreset}
                userFilters={userFilters}
                onFilterStar={onFilterStar}
                isLoading={isLoadingDeepInfoProject}
            >
                {nullable(project, (p) => (
                    <ProjectListItemConnected
                        key={p.id}
                        project={p}
                        onTagClick={setTagsFilterOutside}
                        onClickProvider={onGoalPrewiewShow}
                        selectedResolver={selectedGoalResolver}
                        queryState={queryState}
                        collapsed={!id}
                        hasLink={!id}
                    />
                ))}
            </FilteredPage>
        </Page>
    );
};
