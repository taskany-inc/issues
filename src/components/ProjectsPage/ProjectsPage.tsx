/* eslint-disable react-hooks/rules-of-hooks */
import { MouseEventHandler, useCallback } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import { Button, TabsMenu, TabsMenuItem, nullable } from '@taskany/bricks';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFilterResource } from '../../hooks/useFilterResource';
import { Page, PageContent } from '../Page';
import { PageTitle } from '../PageTitle';
import { createFilterKeys } from '../../utils/hotkeys';
import { Nullish } from '../../types/void';
import { trpc } from '../../utils/trpcClient';
import { FilterById, GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { CommonHeader } from '../CommonHeader';
import { ProjectListItemConnected } from '../ProjectListItemConnected';
import { useGoalPreview } from '../GoalPreview/GoalPreviewProvider';
import { routes } from '../../hooks/router';

import { tr } from './ProjectsPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

export const ProjectsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const nextRouter = useNextRouter();
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
        preset: preset?.data,
    });

    const { setPreview, preview } = useGoalPreview();

    const { data: projects = [] } = trpc.project.getAll.useQuery({
        firstLevel: true,
        goalsQuery: queryState,
    });

    const tabsMenuOptions: Array<[string, string]> = [[tr('Goals'), routes.projects()]];

    const shadowPreset = userFilters.data?.filter(
        (f) => decodeURIComponent(f.params) === decodeURIComponent(queryString),
    )[0];

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

    const defaultTitle = <PageTitle title={tr('Projects')} />;
    const presetInfo =
        user.activityId !== currentPreset?.activityId && currentPreset?.activityId
            ? `${tr('created by')} ${currentPreset?.activity?.user?.name}`
            : undefined;
    const presetTitle = <PageTitle title={tr('Projects')} subtitle={currentPreset?.title} info={presetInfo} />;

    const onShadowPresetTitleClick = useCallback(() => {
        if (shadowPreset) setPreset(shadowPreset.id);
    }, [setPreset, shadowPreset]);

    const shadowPresetInfo =
        user.activityId !== shadowPreset?.activityId && shadowPreset?.activityId
            ? `${tr('created by')} ${shadowPreset?.activity?.user?.name}`
            : undefined;
    const shadowPresetTitle = (
        <PageTitle
            title={tr('Projects')}
            subtitle={shadowPreset?.title}
            info={shadowPresetInfo}
            onClick={onShadowPresetTitleClick}
        />
    );

    // eslint-disable-next-line no-nested-ternary
    const title = currentPreset ? presetTitle : shadowPreset ? shadowPresetTitle : defaultTitle;
    const description = currentPreset && currentPreset.description ? currentPreset.description : tr('description');

    return (
        <Page user={user} ssrTime={ssrTime} title={tr('title')}>
            <CommonHeader title={title} description={description}>
                <TabsMenu>
                    {tabsMenuOptions.map(([title, href]) => (
                        <NextLink key={title} href={href} passHref legacyBehavior>
                            <TabsMenuItem active={nextRouter.asPath.split('?')[0] === href}>{title}</TabsMenuItem>
                        </NextLink>
                    ))}
                </TabsMenu>
            </CommonHeader>

            <FiltersPanel
                queryState={queryState}
                queryString={queryString}
                preset={currentPreset}
                presets={userFilters.data}
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
                {Boolean(queryString) && <Button text={tr('Reset')} onClick={resetQueryState} />}
            </FiltersPanel>

            <PageContent>
                {projects.map((project) => (
                    <ProjectListItemConnected
                        key={project.id}
                        project={project}
                        onTagClick={setTagsFilterOutside}
                        onClickProvider={onGoalPrewiewShow}
                        selectedResolver={selectedGoalResolver}
                        queryState={queryState}
                        collapsed
                        hasLink
                    />
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
