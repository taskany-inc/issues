import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { nullable } from '@taskany/bricks';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { IconAddOutline } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { FilterQueryState, QueryState, buildURLSearchParams, useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { createFilterKeys } from '../../utils/hotkeys';
import { FilterById } from '../../../trpc/inferredTypes';
import { PageContent } from '../PageContent/PageContent';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { PresetDropdown } from '../PresetDropdown';
import { ScrollableView } from '../ScrollableView';
import { useFilterResource } from '../../hooks/useFilterResource';
import { AppliedFiltersBar } from '../AppliedFiltersBar/AppliedFiltersBar';
import { AppliedEstimateFilter } from '../AppliedEstimateFilter/AppliedEstimateFilter';
import { AppliedGoalParentFilter } from '../AppliedGoalParentFilter/AppliedGoalParentFilter';
import { AppliedPriorityFilter } from '../AppliedPriorityFilter/AppliedPriorityFilter';
import { AppliedStateFilter } from '../AppliedStateFilter/AppliedStateFilter';
import { AppliedUsersFilter } from '../AppliedUsersFilter/AppliedUsersFilter';

import { tr } from './FilteredPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

interface FilteredPageProps {
    title: string;
    isLoading: boolean;
    counter?: number;
    total?: number;
    onFilterStar: () => Promise<void>;
    filterPreset?: FilterById;
    userFilters?: React.ComponentProps<typeof PresetDropdown>['presets'];
    filterControls?: React.ReactNode;
    setGroupBy?: React.ComponentProps<typeof FiltersPanel>['setGroupBy'];
}

export const FilteredPage: React.FC<React.PropsWithChildren<FilteredPageProps>> = ({
    title,
    counter,
    total,
    children,
    isLoading,
    filterPreset,
    filterControls,
    setGroupBy,
    onFilterStar,
}) => {
    const router = useRouter();
    const { toggleFilterStar } = useFilterResource();

    const {
        currentPreset,
        queryState,
        queryString,
        resetQueryState,
        setFulltextFilter,
        setPreset,
        batchQueryState,
        queryFilterState,
        groupBy,
    } = useUrlFilterParams({
        preset: filterPreset,
    });

    const [filterQuery, setFilterQuery] = useState<Partial<FilterQueryState> | undefined>(queryFilterState);

    useEffect(() => {
        setFilterQuery(queryFilterState);
    }, [queryFilterState]);

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
        await onFilterStar();
    }, [currentPreset, toggleFilterStar, onFilterStar]);

    const onFilterCreated = useCallback(
        (id: string) => {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
            setPreset(id);
        },
        [setPreset],
    );

    const onFilterDeleteCanceled = useCallback(() => {
        dispatchModalEvent(ModalEvent.FilterDeleteModal)();
    }, []);

    const onFilterDeleted = useCallback(
        (params: string) => {
            router.push(`${router.route}?${params}`);
        },
        [router],
    );

    const onResetAppliedFilters = useCallback(() => {
        resetQueryState();
        setFilterQuery(undefined);
    }, [resetQueryState]);

    const isFiltersNotEmpty = useMemo(
        () => Boolean(queryFilterState && Array.from(buildURLSearchParams(queryFilterState)).length),
        [queryFilterState],
    );

    const filterTriggerRef = useRef<HTMLButtonElement>(null);
    const [filterVisible, setFilterVisible] = useState(false);

    return (
        <>
            <FiltersPanel
                title={title}
                total={total}
                counter={counter}
                onSearchChange={setFulltextFilter}
                loading={isLoading}
                queryState={queryState}
                filterQuery={filterQuery}
                isFiltersNotEmpty={isFiltersNotEmpty}
                filterTriggerRef={filterTriggerRef}
                filterVisible={filterVisible}
                setFilterVisible={setFilterVisible}
                onFilterApply={batchQueryState}
                onFilterReset={onResetAppliedFilters}
                setGroupBy={setGroupBy}
                groupBy={groupBy}
                setPartialQueryByKey={setPartialQueryByKey}
            >
                {filterControls}
            </FiltersPanel>

            {nullable(isFiltersNotEmpty, () => (
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
                    <Button
                        ref={filterTriggerRef}
                        text={tr('Filter')}
                        onClick={() => setFilterVisible((val) => !val)}
                        iconLeft={<IconAddOutline size="xxs" />}
                    />
                </AppliedFiltersBar>
            ))}

            <PageContent>
                <ScrollableView>{children}</ScrollableView>
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
        </>
    );
};
