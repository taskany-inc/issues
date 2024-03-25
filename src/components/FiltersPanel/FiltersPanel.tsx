import { FC, useCallback, memo, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { IconAddOutline } from '@taskany/icons';
import { nullable } from '@taskany/bricks';

import { filtersTakeCount } from '../../utils/filters';
import { FilterQueryState, QueryState, buildURLSearchParams, useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { ProjectFilter } from '../ProjectFilter';
import { TagFilter } from '../TagFilter';
import { EstimateFilter } from '../EstimateFilter';
import { UserFilter } from '../UserFilter/UserFilter';
import { PriorityFilter } from '../PriorityFilter';
import { StateFilter } from '../StateFilter';
import { ActivityByIdReturnType, FilterById } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { SortFilter } from '../SortFilter/SortFilter';
import { FilterPopup } from '../FilterPopup/FilterPopup';
import { getUserName, prepareUserDataFromActivity } from '../../utils/getUserName';
import { filtersPanel, filtersPanelTitle, filtersPanelResetButton } from '../../utils/domObjects';
import {
    FilterBarCounter,
    FiltersBarLayoutSwitch,
    FiltersBarControlGroup,
    FiltersBarViewDropdown,
    FiltersBar,
    FiltersBarItem,
    FiltersBarTitle,
    LayoutType,
    layoutType,
    FiltersBarDropdownTitle,
    FiltersBarDropdownContent,
} from '../FiltersBar/FiltersBar';
import { GlobalSearch } from '../GlobalSearch/GlobalSearch';
import { Separator } from '../Separator/Separator';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { useFilterResource } from '../../hooks/useFilterResource';
import { AppliedFiltersBar } from '../AppliedFiltersBar/AppliedFiltersBar';
import { AppliedEstimateFilter } from '../AppliedEstimateFilter/AppliedEstimateFilter';
import { AppliedGoalParentFilter } from '../AppliedGoalParentFilter/AppliedGoalParentFilter';
import { AppliedPriorityFilter } from '../AppliedPriorityFilter/AppliedPriorityFilter';
import { AppliedStateFilter } from '../AppliedStateFilter/AppliedStateFilter';
import { AppliedUsersFilter } from '../AppliedUsersFilter/AppliedUsersFilter';
import { PageUserMenu } from '../PageUserMenu';
import { AppliedTagFilter } from '../AppliedTagFilter/AppliedTagFilter';

import { tr } from './FiltersPanel.i18n';

type Users = React.ComponentProps<typeof UserFilter>['users'];

function mapUserToView(list: ActivityByIdReturnType[]): Users {
    return list.reduce<Users>((acc, activity) => {
        const data = prepareUserDataFromActivity(activity);
        if (data && data.activityId) {
            acc.push({
                id: data.activityId,
                name: getUserName(data),
                email: data.email,
                image: data.image,
            });
        }

        return acc;
    }, []);
}

const useQueryOptions = {
    keepPreviousData: true,
};

export const FiltersPanel: FC<{
    title: string;
    total?: number;
    counter?: number;
    loading?: boolean;
    filterPreset?: FilterById;
    enableViewToggle?: boolean;
    children?: ReactNode;
}> = memo(({ children, title, total = 0, counter = 0, enableViewToggle, filterPreset }) => {
    const { toggleFilterStar } = useFilterResource();

    const {
        currentPreset,
        queryString,
        queryState,
        resetQueryState,
        batchQueryState,
        queryFilterState,
        groupBy,
        setGroupBy,
    } = useUrlFilterParams({
        preset: filterPreset,
    });

    const [layout] = useState<LayoutType>(layoutType.table);
    const filterTriggerRef = useRef<HTMLButtonElement>(null);
    const [filterVisible, setFilterVisible] = useState(false);
    const [ownersQuery, setOwnersQuery] = useState('');
    const [issuersQuery, setIssuersQuery] = useState('');
    const [participantsQuery, setParticipantsQuery] = useState('');
    const [projectsQuery, setProjectsQuery] = useState('');
    const [tagsQuery, setTagsQuery] = useState('');
    const [filterQuery, setFilterQuery] = useState<Partial<FilterQueryState> | undefined>(queryFilterState);

    useEffect(() => {
        setFilterQuery(queryState);
    }, [queryState]);

    const { data: owners = [] } = trpc.user.suggestions.useQuery(
        {
            query: ownersQuery,
            include: queryState?.owner,
            take: filtersTakeCount,
        },
        useQueryOptions,
    );

    const { data: issuers = [] } = trpc.user.suggestions.useQuery(
        {
            query: issuersQuery,
            include: queryState?.issuer,
            take: filtersTakeCount,
        },
        useQueryOptions,
    );

    const { data: participants = [] } = trpc.user.suggestions.useQuery(
        {
            query: participantsQuery,
            include: queryState?.participant,
            take: filtersTakeCount,
        },
        useQueryOptions,
    );

    const { data: projects = [] } = trpc.project.suggestions.useQuery(
        {
            query: projectsQuery,
            include: queryState?.project,
            take: filtersTakeCount,
        },
        useQueryOptions,
    );

    const { data: tags = [] } = trpc.tag.suggestions.useQuery(
        {
            query: tagsQuery,
            include: queryState?.tag,
            take: filtersTakeCount,
        },
        useQueryOptions,
    );
    const { data: states = [] } = trpc.state.all.useQuery();
    const { data: priorities = [] } = trpc.priority.getAll.useQuery();

    const setPartialQueryByKey = useCallback(<K extends keyof QueryState>(key: K) => {
        return (value: QueryState[K]) => {
            setFilterQuery((prev) => {
                return {
                    ...prev,
                    [key]: value,
                };
            });
        };
    }, []);

    const filterStarHandler = useCallback(async () => {
        if (!currentPreset) {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
            return;
        }

        if (currentPreset._isOwner) {
            dispatchModalEvent(ModalEvent.FilterDeleteModal)();
            return;
        }

        await toggleFilterStar({
            id: currentPreset.id,
            direction: !currentPreset._isStarred,
        });
    }, [currentPreset, toggleFilterStar]);

    const onApplyClick = useCallback(() => {
        setFilterVisible(false);
        batchQueryState?.({ ...filterQuery });
    }, [filterQuery, batchQueryState]);

    const onResetClick = useCallback(() => {
        setFilterVisible(false);
        resetQueryState();
    }, [resetQueryState]);

    const isFiltersEmpty = useMemo(
        () => !queryFilterState || !Array.from(buildURLSearchParams(queryFilterState)).length,
        [queryFilterState],
    );

    const groupedByProject = groupBy === 'project';

    return (
        <>
            <FiltersBar {...filtersPanel.attr}>
                <FiltersBarItem>
                    <FiltersBarTitle {...filtersPanelTitle.attr}>{title}</FiltersBarTitle>
                </FiltersBarItem>
                <Separator />
                {children}
                <FiltersBarItem layout="fill">
                    <FiltersBarControlGroup>
                        {isFiltersEmpty ? (
                            <Button
                                key="filter"
                                ref={filterTriggerRef}
                                text={tr('Filter')}
                                onClick={() => setFilterVisible((val) => !val)}
                                iconLeft={<IconAddOutline size="xxs" />}
                            />
                        ) : (
                            <Button
                                key="resetFilter"
                                onClick={onResetClick}
                                text={tr('Reset')}
                                {...filtersPanelResetButton.attr}
                            />
                        )}
                        <FilterBarCounter total={total} counter={counter} />
                    </FiltersBarControlGroup>
                </FiltersBarItem>
                <FiltersBarItem>
                    <FiltersBarLayoutSwitch value={layout} />
                </FiltersBarItem>
                <Separator />
                {nullable(enableViewToggle, () => (
                    <>
                        <FiltersBarItem>
                            <FiltersBarViewDropdown>
                                <FiltersBarDropdownTitle>{tr('Grouping')}</FiltersBarDropdownTitle>
                                <FiltersBarDropdownContent>
                                    <Button
                                        text={tr('Project')}
                                        view={groupedByProject ? 'checked' : 'default'}
                                        onClick={() => setGroupBy(groupedByProject ? undefined : 'project')}
                                    />
                                </FiltersBarDropdownContent>
                            </FiltersBarViewDropdown>
                        </FiltersBarItem>
                        <Separator />
                    </>
                ))}
                <FiltersBarItem>
                    <GlobalSearch />
                </FiltersBarItem>
                <FiltersBarItem>
                    <PageUserMenu />
                </FiltersBarItem>
            </FiltersBar>
            {nullable(!isFiltersEmpty, () => (
                <AppliedFiltersBar
                    filterPreset={filterPreset}
                    queryString={queryString}
                    onDeletePreset={filterStarHandler}
                    onSavePreset={filterStarHandler}
                >
                    {nullable(Boolean(queryFilterState?.state) || Boolean(queryFilterState?.stateType), () => (
                        <AppliedStateFilter
                            label={tr('State')}
                            value={queryFilterState?.state}
                            stateTypes={queryFilterState?.stateType}
                            readOnly
                        />
                    ))}
                    {nullable(Boolean(queryFilterState?.issuer), () => (
                        <AppliedUsersFilter label={tr('Issuer')} value={queryFilterState?.issuer} readOnly />
                    ))}
                    {nullable(Boolean(queryFilterState?.owner), () => (
                        <AppliedUsersFilter label={tr('Owner')} value={queryFilterState?.owner} readOnly />
                    ))}
                    {nullable(Boolean(queryFilterState?.participant), () => (
                        <AppliedUsersFilter label={tr('Participant')} value={queryFilterState?.participant} readOnly />
                    ))}
                    {nullable(Boolean(queryFilterState?.estimate), () => (
                        <AppliedEstimateFilter label={tr('Estimate')} value={queryFilterState?.estimate} readOnly />
                    ))}
                    {nullable(Boolean(queryFilterState?.priority), () => (
                        <AppliedPriorityFilter label={tr('Priority')} value={queryFilterState?.priority} readOnly />
                    ))}
                    {nullable(Boolean(queryFilterState?.project), () => (
                        <AppliedGoalParentFilter label={tr('Project')} value={queryFilterState?.project} readOnly />
                    ))}
                    {nullable(Boolean(queryFilterState?.tag), () => (
                        <AppliedTagFilter label={tr('Tags')} value={queryFilterState?.tag} readOnly />
                    ))}
                    <Button
                        ref={filterTriggerRef}
                        text={tr('Filter')}
                        onClick={() => setFilterVisible((val) => !val)}
                        iconLeft={<IconAddOutline size="xxs" />}
                    />
                </AppliedFiltersBar>
            ))}
            <FilterPopup
                visible={filterVisible}
                onApplyClick={onApplyClick}
                filterTriggerRef={filterTriggerRef}
                switchVisible={setFilterVisible}
                activeTab="state"
            >
                <StateFilter
                    text={tr('State')}
                    value={filterQuery?.state}
                    stateTypes={filterQuery?.stateType}
                    states={states}
                    onStateChange={setPartialQueryByKey('state')}
                    onStateTypeChange={setPartialQueryByKey('stateType')}
                />
                <PriorityFilter
                    text={tr('Priority')}
                    value={filterQuery?.priority}
                    priorities={priorities}
                    onChange={setPartialQueryByKey('priority')}
                />

                <EstimateFilter
                    text={tr('Estimate')}
                    value={filterQuery?.estimate}
                    onChange={setPartialQueryByKey('estimate')}
                />

                <ProjectFilter
                    text={tr('Project')}
                    value={filterQuery?.project}
                    projects={projects}
                    onChange={setPartialQueryByKey('project')}
                    onSearchChange={setProjectsQuery}
                />
                <UserFilter
                    tabName="issuer"
                    text={tr('Issuer')}
                    users={mapUserToView(issuers)}
                    value={filterQuery?.issuer}
                    onChange={setPartialQueryByKey('issuer')}
                    onSearchChange={setIssuersQuery}
                />
                <UserFilter
                    tabName="owner"
                    text={tr('Owner')}
                    users={mapUserToView(owners)}
                    value={filterQuery?.owner}
                    onChange={setPartialQueryByKey('owner')}
                    onSearchChange={setOwnersQuery}
                />
                <TagFilter
                    text={tr('Tags')}
                    value={filterQuery?.tag}
                    tags={tags}
                    onChange={setPartialQueryByKey('tag')}
                    onSearchChange={setTagsQuery}
                />
                <UserFilter
                    tabName="participant"
                    text={tr('Participant')}
                    users={mapUserToView(participants)}
                    value={filterQuery?.participant}
                    onChange={setPartialQueryByKey('participant')}
                    onSearchChange={setParticipantsQuery}
                />
                <SortFilter text={tr('Sort')} value={filterQuery?.sort} onChange={setPartialQueryByKey('sort')} />
            </FilterPopup>
        </>
    );
});
