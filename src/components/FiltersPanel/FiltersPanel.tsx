import { FC, useCallback, memo, useState, useEffect, ReactNode, useMemo } from 'react';
import {
    Button,
    FiltersBar,
    FiltersBarControlGroup,
    FiltersBarCounter,
    FiltersBarItem,
    FiltersBarTitle,
    Checkbox,
} from '@taskany/bricks/harmony';
import { nullable, useLatest } from '@taskany/bricks';

import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { FilterById } from '../../../trpc/inferredTypes';
import {
    filtersPanel,
    filtersPanelTitle,
    filtersPanelResetButton,
    appliedFiltersPanel,
    appliedFiltersPanelEstimate,
    appliedFiltersPanelState,
    sortPanelEmptyProjectsCheckbox,
} from '../../utils/domObjects';
import { FilterQueryState, QueryState, SortableGoalsProps, SortableProjectsProps } from '../../utils/parseUrlParams';
import {
    FiltersBarViewDropdown,
    FiltersBarDropdownTitle,
    FiltersBarDropdownContent,
    FiltersBarLayoutSwitch,
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
import { SortList } from '../SortList/SortList';
import { useLocale } from '../../hooks/useLocale';

import { tr } from './FiltersPanel.i18n';

export const FiltersPanel: FC<{
    title: string;
    total?: number;
    counter?: number;
    filterPreset?: FilterById;
    enableViewToggle?: boolean;
    enableLayoutToggle?: boolean;
    children?: ReactNode;
    enableHideProjectToggle?: boolean;
    enableProjectsSort?: boolean;
}> = memo(
    ({
        children,
        title,
        total = 0,
        counter = 0,
        enableViewToggle,
        enableLayoutToggle,
        enableProjectsSort,
        enableHideProjectToggle,
        filterPreset,
    }) => {
        const { toggleFilterStar, exportCsv } = useFilterResource();
        const locale = useLocale();

        const {
            currentPreset,
            queryString,
            queryState,
            projectsSort,
            resetQueryState,
            batchQueryState,
            setProjectsSortFilter,
            setSortFilter,
            queryFilterState,
            groupBy,
            view,
            setGroupBy,
            hideCriteria,
            setHideCriteria,
            hideEmptyProjects,
            setHideEmptyProjects,
            setView,
        } = useUrlFilterParams({
            preset: filterPreset,
        });

        const enableGoalsSort = view !== 'kanban';

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

        const exportCsvHandler = useCallback(async () => {
            if (currentPreset?._isOwner) {
                await exportCsv(currentPreset.id);
            }
        }, [currentPreset, exportCsv]);

        const onApplyClick = useCallback(
            (key?: keyof Omit<FilterQueryState, 'query' | 'sort' | 'hideCriteria' | 'hideEmptyProjects'>) => {
                if (!filterQueryRef.current) return;

                if (key) {
                    filterQueryRef.current[key] = [];
                }

                if (key === 'state') {
                    filterQueryRef.current.stateType = [];
                }

                batchQueryState?.({ ...filterQueryRef.current });
            },
            [filterQueryRef, batchQueryState],
        );

        const onResetClick = useCallback(() => {
            setFilterQuery(undefined);
            resetQueryState();
        }, [resetQueryState]);

        const handleChange = useCallback(
            (key: keyof FilterQueryState) => (values?: { id: string }[]) => {
                if (key === 'state') {
                    setPartialQueryByKey('stateType')();
                }

                setPartialQueryByKey(key)(values?.map(({ id }) => id));
            },
            [setPartialQueryByKey],
        );

        const onClearFilter = useCallback(
            (key: keyof Omit<FilterQueryState, 'query' | 'sort' | 'hideCriteria' | 'hideEmptyProjects'>) => () => {
                setPartialQueryByKey(key)();
                onApplyClick(key);
            },
            [onApplyClick, setPartialQueryByKey],
        );

        const isFiltersEmpty = useMemo(
            () => Object.values(filterQuery || {}).filter(Boolean).length === 0,
            [filterQuery],
        );
        const groupedByProject = groupBy === 'project';

        const filterItems: { id: keyof FilterQueryState; title: string }[] = useMemo(() => {
            return [
                { id: 'state', title: tr('State') },
                { id: 'priority', title: tr('Priority') },
                { id: 'estimate', title: tr('Estimate') },
                { id: 'project', title: tr('Project') },
                { id: 'tag', title: tr('Tag') },
                { id: 'issuer', title: tr('Issuer') },
                { id: 'owner', title: tr('Assignee') },
                { id: 'participant', title: tr('Participant') },
            ];
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [locale]);

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
                            <FiltersBarCounter total={total} counter={counter} />
                        </FiltersBarControlGroup>
                    </FiltersBarItem>
                    {nullable(enableLayoutToggle, () => (
                        <>
                            <FiltersBarItem>
                                <FiltersBarLayoutSwitch value={view} onChange={setView} />
                            </FiltersBarItem>
                            <Separator />
                        </>
                    ))}

                    <FiltersBarItem>
                        <FiltersBarViewDropdown>
                            {nullable(enableViewToggle, () => (
                                <>
                                    <FiltersBarDropdownTitle>{tr('Grouping')}</FiltersBarDropdownTitle>
                                    <FiltersBarDropdownContent>
                                        <Button
                                            text={tr('Project')}
                                            view={groupedByProject ? 'checked' : 'default'}
                                            onClick={() => setGroupBy(groupedByProject ? undefined : 'project')}
                                        />
                                    </FiltersBarDropdownContent>
                                </>
                            ))}

                            {nullable(enableGoalsSort, () => (
                                <>
                                    <FiltersBarDropdownTitle>{tr('Goals sort')}</FiltersBarDropdownTitle>
                                    <FiltersBarDropdownContent>
                                        <SortList
                                            value={filterQuery?.sort}
                                            onChange={(key, dir) => {
                                                let sortParams = (filterQuery?.sort ?? []).slice();

                                                if (!dir) {
                                                    sortParams = sortParams.filter(({ key: k }) => key !== k);
                                                } else {
                                                    const paramExistingIndex = sortParams.findIndex(
                                                        ({ key: k }) => key === k,
                                                    );

                                                    if (paramExistingIndex > -1) {
                                                        sortParams[paramExistingIndex] = {
                                                            key: key as SortableGoalsProps,
                                                            dir,
                                                        };
                                                    } else if (key === 'rankGlobal') {
                                                        sortParams = [{ key, dir }];
                                                    } else {
                                                        sortParams = sortParams.filter(
                                                            ({ key }) => key !== 'rankGlobal',
                                                        );
                                                        sortParams.push({ key: key as SortableGoalsProps, dir });
                                                    }
                                                }

                                                setSortFilter(sortParams);
                                            }}
                                        />
                                    </FiltersBarDropdownContent>
                                </>
                            ))}

                            {nullable(enableProjectsSort, () => (
                                <>
                                    <FiltersBarDropdownTitle>{tr('Projects sort')}</FiltersBarDropdownTitle>
                                    <FiltersBarDropdownContent>
                                        <SortList
                                            variant="projects"
                                            value={projectsSort}
                                            onChange={(key, dir) => {
                                                let sortParams = (projectsSort ?? []).slice();

                                                if (!dir) {
                                                    sortParams = sortParams.filter(({ key: k }) => key !== k);
                                                } else {
                                                    const paramExistingIndex = sortParams.findIndex(
                                                        ({ key: k }) => key === k,
                                                    );

                                                    if (paramExistingIndex > -1) {
                                                        sortParams[paramExistingIndex] = {
                                                            key: key as SortableProjectsProps,
                                                            dir,
                                                        };
                                                    } else {
                                                        sortParams.push({ key: key as SortableProjectsProps, dir });
                                                    }
                                                }

                                                setProjectsSortFilter(sortParams);
                                            }}
                                        />
                                    </FiltersBarDropdownContent>
                                </>
                            ))}
                            <FiltersBarDropdownTitle>{tr('Visibility')}</FiltersBarDropdownTitle>
                            <FiltersBarDropdownContent>
                                <Checkbox
                                    label={tr('Criteria')}
                                    checked={!hideCriteria}
                                    onChange={() => setHideCriteria(!hideCriteria)}
                                />
                            </FiltersBarDropdownContent>
                            {nullable(enableHideProjectToggle, () => (
                                <FiltersBarDropdownContent>
                                    <Checkbox
                                        {...sortPanelEmptyProjectsCheckbox.attr}
                                        label={tr('Empty Projects')}
                                        checked={!hideEmptyProjects}
                                        onChange={() => setHideEmptyProjects(!hideEmptyProjects)}
                                    />
                                </FiltersBarDropdownContent>
                            ))}
                        </FiltersBarViewDropdown>
                    </FiltersBarItem>
                    <Separator />
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
                        onExport={exportCsvHandler}
                        {...appliedFiltersPanel.attr}
                    >
                        {nullable(Boolean(filterQuery?.state) || Boolean(filterQuery?.stateType), () => (
                            <AppliedStateFilter
                                label={tr('State')}
                                value={filterQuery?.state}
                                stateTypes={filterQuery?.stateType}
                                onChange={handleChange('state')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('state')}
                                {...appliedFiltersPanelState.attr}
                            />
                        ))}
                        {nullable(Boolean(filterQuery?.issuer), () => (
                            <AppliedUsersFilter
                                label={tr('Issuer')}
                                value={filterQuery?.issuer}
                                onChange={handleChange('issuer')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('issuer')}
                            />
                        ))}
                        {nullable(Boolean(filterQuery?.owner), () => (
                            <AppliedUsersFilter
                                label={tr('Assignee')}
                                value={filterQuery?.owner}
                                onChange={handleChange('owner')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('owner')}
                            />
                        ))}
                        {nullable(Boolean(filterQuery?.participant), () => (
                            <AppliedUsersFilter
                                label={tr('Participant')}
                                value={filterQuery?.participant}
                                onChange={handleChange('participant')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('participant')}
                            />
                        ))}
                        {nullable(Boolean(filterQuery?.estimate), () => (
                            <AppliedEstimateFilter
                                label={tr('Estimate')}
                                value={filterQuery?.estimate}
                                onChange={setPartialQueryByKey('estimate')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('estimate')}
                                {...appliedFiltersPanelEstimate.attr}
                            />
                        ))}
                        {nullable(Boolean(filterQuery?.priority), () => (
                            <AppliedPriorityFilter
                                label={tr('Priority')}
                                value={filterQuery?.priority}
                                onChange={handleChange('priority')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('priority')}
                            />
                        ))}
                        {nullable(Boolean(filterQuery?.project), () => (
                            <AppliedGoalParentFilter
                                label={tr('Project')}
                                value={filterQuery?.project}
                                onChange={handleChange('project')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('project')}
                            />
                        ))}
                        {nullable(Boolean(filterQuery?.tag), () => (
                            <AppliedTagFilter
                                label={tr('Tag')}
                                value={filterQuery?.tag}
                                onChange={handleChange('tag')}
                                onClose={onApplyClick}
                                onClearFilter={onClearFilter('tag')}
                            />
                        ))}
                        <AddFilterDropdown
                            items={restFilterItems}
                            onChange={({ id }) => setPartialQueryByKey(id)([])}
                        />
                    </AppliedFiltersBar>
                ))}
            </>
        );
    },
);
