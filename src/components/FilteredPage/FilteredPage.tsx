import { useCallback } from 'react';
import styled from 'styled-components';
import { Button, FiltersAction, nullable } from '@taskany/bricks';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { IconStarOutline, IconStarSolid } from '@taskany/icons';

import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { useFilterResource } from '../../hooks/useFilterResource';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { createFilterKeys } from '../../utils/hotkeys';
import { filtersPanelResetButton } from '../../utils/domObjects';
import { FilterById } from '../../../trpc/inferredTypes';
import { PageContent } from '../Page';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { PresetDropdown } from '../PresetDropdown';
import { LimitDropdown } from '../LimitDropdown';
import { StarredFilter } from '../StarredFilter/StarredFilter';
import { WatchingFilter } from '../WatchingFilter/WatchingFilter';

import { tr } from './FilteredPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('../FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('../FilterDeleteForm/FilterDeleteForm'));

interface FilteredPageProps {
    isLoading: boolean;
    counter?: number;
    total?: number;
    onFilterStar: () => Promise<void>;
    filterPreset?: FilterById;
    userFilters?: React.ComponentProps<typeof PresetDropdown>['presets'];
    filterControls?: React.ReactNode;
}

const StyledFilterControls = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 1 0 0;
`;

const StyledResetButton = styled(Button)`
    margin-left: auto;
`;

export const FilteredPage: React.FC<React.PropsWithChildren<FilteredPageProps>> = ({
    counter,
    total,
    children,
    isLoading,
    onFilterStar,
    filterPreset,
    userFilters,
    filterControls,
}) => {
    const router = useRouter();
    const { toggleFilterStar } = useFilterResource();

    const {
        currentPreset,
        queryState,
        queryString,
        setStarredFilter,
        setWatchingFilter,
        setFulltextFilter,
        resetQueryState,
        setPreset,
        batchQueryState,
        setLimitFilter,
        queryFilterState,
    } = useUrlFilterParams({
        preset: filterPreset,
    });

    const filterStarHandler = useCallback(async () => {
        if (currentPreset) {
            if (currentPreset._isOwner) {
                dispatchModalEvent(ModalEvent.FilterDeleteModal)();
            } else {
                await toggleFilterStar({
                    id: currentPreset.id,
                    direction: !currentPreset._isStarred,
                });
                await onFilterStar();
            }
        } else {
            dispatchModalEvent(ModalEvent.FilterCreateModal)();
        }
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

    return (
        <>
            <FiltersPanel
                loading={isLoading}
                total={total}
                counter={counter}
                queryState={queryState}
                queryFilterState={queryFilterState}
                queryString={queryString}
                onSearchChange={setFulltextFilter}
                onFilterApply={batchQueryState}
            >
                <StyledFilterControls>
                    {filterControls}

                    <StarredFilter value={queryState?.starred} onChange={setStarredFilter} />

                    <WatchingFilter value={queryState?.watching} onChange={setWatchingFilter} />

                    {nullable(userFilters, (presets) => (
                        <PresetDropdown
                            text={tr('Preset')}
                            value={filterPreset}
                            presets={presets}
                            onChange={setPreset}
                        />
                    ))}

                    {nullable(queryState?.limit, (lf) => (
                        <LimitDropdown text={tr('Limit')} value={[String(lf)]} onChange={setLimitFilter} />
                    ))}

                    {((Boolean(queryString) && !filterPreset) ||
                        (filterPreset && !filterPreset._isOwner && !filterPreset._isStarred)) &&
                        !filterPreset?.default && (
                            <FiltersAction onClick={filterStarHandler}>
                                <IconStarOutline size="s" />
                            </FiltersAction>
                        )}

                    {filterPreset && (filterPreset._isOwner || filterPreset._isStarred) && (
                        <FiltersAction onClick={filterStarHandler}>
                            <IconStarSolid size="s" />
                        </FiltersAction>
                    )}
                    {nullable(queryString || filterPreset, () => (
                        <StyledResetButton text="Reset" onClick={resetQueryState} {...filtersPanelResetButton.attr} />
                    ))}
                </StyledFilterControls>
            </FiltersPanel>

            <PageContent>{children}</PageContent>

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
