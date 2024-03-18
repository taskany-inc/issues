import { FC, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { nullable } from '@taskany/bricks';

import { useUrlFilterParams } from '../hooks/useUrlFilterParams';
import { FilterById } from '../../trpc/inferredTypes';
import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';
import { createFilterKeys } from '../utils/hotkeys';

const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));
const FilterCreateForm = dynamic(() => import('./FilterCreateForm/FilterCreateForm'));
const FilterDeleteForm = dynamic(() => import('./FilterDeleteForm/FilterDeleteForm'));

export const PresetModals: FC<{
    preset?: FilterById;
}> = ({ preset }) => {
    const router = useRouter();

    const { currentPreset, queryString, setPreset } = useUrlFilterParams({
        preset,
    });

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
