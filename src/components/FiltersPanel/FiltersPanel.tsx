import { FC, useCallback, memo, useState, useEffect, ReactNode, useMemo } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { nullable, useLatest } from '@taskany/bricks';

import { FilterQueryState, QueryState, useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { FilterById } from '../../../trpc/inferredTypes';
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
    AddFilterDropdown,
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
    const [filterQuery, setFilterQuery] = useState<Partial<FilterQueryState> | undefined>(queryFilterState);
    const filterQueryRef = useLatest(filterQuery);

    useEffect(() => {
        setFilterQuery(queryState);
    }, [queryState]);

    const setPartialQueryByKey = useCallback(<K extends keyof QueryState>(key: K) => {
        return (value?: QueryState[K]) => {
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
        // ensures that batchQueryState is executed after all synchronous operations,
        // preventing potential state issues due to race conditions or unexpected execution order.
        queueMicrotask(() => {
            batchQueryState?.({ ...filterQueryRef.current });
        });
    }, [filterQueryRef, batchQueryState]);

    const onResetClick = useCallback(() => {
        setFilterQuery(undefined);
        resetQueryState();
    }, [resetQueryState]);

    const isFiltersEmpty = useMemo(() => Object.values(filterQuery || {}).filter(Boolean).length === 0, [filterQuery]);
    const groupedByProject = groupBy === 'project';

    const filterItems: { id: keyof FilterQueryState; title: string }[] = useMemo(() => {
        return [
            { id: 'state', title: tr('State') },
            { id: 'priority', title: tr('Priority') },
            { id: 'estimate', title: tr('Estimate') },
            { id: 'project', title: tr('Project') },
            { id: 'tag', title: tr('Tag') },
            { id: 'issuer', title: tr('Issuer') },
            { id: 'owner', title: tr('Owner') },
            { id: 'participant', title: tr('Participant') },
        ];
    }, []);

    const restFilterItems = useMemo(() => {
        if (filterQuery && filterQuery.stateType) {
            filterQuery.state = [];
        }
        return filterItems.filter(({ id }) => !filterQuery?.[id]);
    }, [filterQuery, filterItems]);

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
                        {nullable(
                            isFiltersEmpty,
                            () => (
                                <AddFilterDropdown
                                    items={restFilterItems}
                                    onChange={({ id }) => setPartialQueryByKey(id)([])}
                                />
                            ),
                            <Button
                                key="resetFilter"
                                onClick={onResetClick}
                                text={tr('Reset')}
                                {...filtersPanelResetButton.attr}
                            />,
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
                    {nullable(Boolean(filterQuery?.state) || Boolean(filterQuery?.stateType), () => (
                        <AppliedStateFilter
                            label={tr('State')}
                            value={filterQuery?.state}
                            stateTypes={filterQuery?.stateType}
                            onChange={(values) => {
                                setPartialQueryByKey('stateType')();
                                setPartialQueryByKey('state')(values);
                            }}
                            onClose={onApplyClick}
                        />
                    ))}
                    {nullable(Boolean(filterQuery?.issuer), () => (
                        <AppliedUsersFilter
                            label={tr('Issuer')}
                            value={filterQuery?.issuer}
                            onChange={setPartialQueryByKey('issuer')}
                            onClose={onApplyClick}
                        />
                    ))}
                    {nullable(Boolean(filterQuery?.owner), () => (
                        <AppliedUsersFilter
                            label={tr('Owner')}
                            value={filterQuery?.owner}
                            onChange={setPartialQueryByKey('owner')}
                            onClose={onApplyClick}
                        />
                    ))}
                    {nullable(Boolean(filterQuery?.participant), () => (
                        <AppliedUsersFilter
                            label={tr('Participant')}
                            value={filterQuery?.participant}
                            onChange={setPartialQueryByKey('participant')}
                            onClose={onApplyClick}
                        />
                    ))}
                    {nullable(Boolean(filterQuery?.estimate), () => (
                        <AppliedEstimateFilter
                            label={tr('Estimate')}
                            value={filterQuery?.estimate}
                            onChange={setPartialQueryByKey('estimate')}
                            onClose={onApplyClick}
                        />
                    ))}
                    {nullable(Boolean(filterQuery?.priority), () => (
                        <AppliedPriorityFilter
                            label={tr('Priority')}
                            value={filterQuery?.priority}
                            onChange={setPartialQueryByKey('priority')}
                            onClose={onApplyClick}
                        />
                    ))}
                    {nullable(Boolean(filterQuery?.project), () => (
                        <AppliedGoalParentFilter
                            label={tr('Project')}
                            value={filterQuery?.project}
                            onChange={setPartialQueryByKey('project')}
                            onClose={onApplyClick}
                        />
                    ))}
                    {nullable(Boolean(filterQuery?.tag), () => (
                        <AppliedTagFilter
                            label={tr('Tag')}
                            value={filterQuery?.tag}
                            onChange={setPartialQueryByKey('tag')}
                            onClose={onApplyClick}
                        />
                    ))}
                    <AddFilterDropdown items={restFilterItems} onChange={({ id }) => setPartialQueryByKey(id)([])} />
                </AppliedFiltersBar>
            ))}
        </>
    );
});
