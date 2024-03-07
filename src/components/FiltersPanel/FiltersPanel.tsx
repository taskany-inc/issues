import { FC, useCallback, memo, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { IconAddOutline } from '@taskany/icons';

import { filtersTakeCount } from '../../utils/filters';
import { FilterQueryState, QueryState, buildURLSearchParams } from '../../hooks/useUrlFilterParams';
import { ProjectFilter } from '../ProjectFilter';
import { TagFilter } from '../TagFilter';
import { EstimateFilter } from '../EstimateFilter';
import { UserFilter } from '../UserFilter/UserFilter';
import { PriorityFilter } from '../PriorityFilter';
import { StateFilter } from '../StateFilter';
import { FiltersPanelApplied } from '../FiltersPanelApplied/FiltersPanelApplied';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
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
} from '../FiltersBar/FiltersBar';
import { SearchFilter } from '../SearchFilter';
import { Separator } from '../Separator/Separator';

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
    queryState?: QueryState;
    queryFilterState?: FilterQueryState;
    onSearchChange: (search: string) => void;
    onFilterApply?: (state: Partial<QueryState>) => void;
    onFilterReset: () => void;
    children?: ReactNode;
}> = memo(
    ({
        children,
        title,
        total = 0,
        counter = 0,
        onSearchChange,
        onFilterReset,
        queryState,
        queryFilterState,
        onFilterApply,
    }) => {
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

        const onApplyClick = useCallback(() => {
            setFilterVisible(false);
            onFilterApply?.({ ...filterQuery });
        }, [filterQuery, onFilterApply]);

        const onResetClick = useCallback(() => {
            setFilterVisible(false);
            onFilterReset();
        }, [onFilterReset]);

        const isFiltersEmpty = useMemo(
            () => !queryFilterState || !Array.from(buildURLSearchParams(queryFilterState)).length,
            [queryFilterState],
        );

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
                    <FiltersBarItem>
                        <FiltersBarViewDropdown />
                    </FiltersBarItem>
                    <Separator />
                    <FiltersBarItem>
                        <SearchFilter defaultValue={queryState?.query} onChange={onSearchChange} />
                    </FiltersBarItem>
                </FiltersBar>
                <FiltersPanelApplied
                    queryState={queryState}
                    states={states}
                    issuers={mapUserToView(issuers)}
                    owners={mapUserToView(owners)}
                    participants={mapUserToView(participants)}
                    projects={projects}
                    tags={tags}
                />
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
    },
);
