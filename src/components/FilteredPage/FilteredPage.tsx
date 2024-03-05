import { useCallback } from 'react';
import { nullable } from '@taskany/bricks';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

import { useUrlFilterParams } from '../../hooks/useUrlFilterParams';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { createFilterKeys } from '../../utils/hotkeys';
import { FilterById } from '../../../trpc/inferredTypes';
import { PageContent } from '../PageContent/PageContent';
import { FiltersPanel } from '../FiltersPanel/FiltersPanel';
import { PresetDropdown } from '../PresetDropdown';
import { ScrollableView } from '../ScrollableView';

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
}

export const FilteredPage: React.FC<React.PropsWithChildren<FilteredPageProps>> = ({
    title,
    counter,
    total,
    children,
    isLoading,
    filterPreset,
}) => {
    const router = useRouter();

    const {
        currentPreset,
        queryState,
        queryString,
        resetQueryState,
        setFulltextFilter,
        setPreset,
        batchQueryState,
        queryFilterState,
    } = useUrlFilterParams({
        preset: filterPreset,
    });

    // const filterStarHandler = useCallback(async () => {
    //     if (currentPreset) {
    //         if (currentPreset._isOwner) {
    //             dispatchModalEvent(ModalEvent.FilterDeleteModal)();
    //         } else {
    //             await toggleFilterStar({
    //                 id: currentPreset.id,
    //                 direction: !currentPreset._isStarred,
    //             });
    //             await onFilterStar();
    //         }
    //     } else {
    //         dispatchModalEvent(ModalEvent.FilterCreateModal)();
    //     }
    // }, [currentPreset, toggleFilterStar, onFilterStar]);

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
                title={title}
                total={total}
                counter={counter}
                onSearchChange={setFulltextFilter}
                loading={isLoading}
                queryState={queryState}
                queryFilterState={queryFilterState}
                onFilterApply={batchQueryState}
                onFilterReset={resetQueryState}
            />

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
