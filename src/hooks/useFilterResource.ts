import { notifyPromise } from '../utils/notifyPromise';
import { CreateFilter } from '../schema/filter';
import { ToggleSubscription } from '../schema/common';
import { trpc } from '../utils/trpcClient';

export const useFilterResource = () => {
    const createMutation = trpc.filter.create.useMutation();
    const deleteMutation = trpc.filter.delete.useMutation();
    const toggleMutation = trpc.filter.toggleStargizer.useMutation();
    const utils = trpc.useContext();

    const createFilter = (data: CreateFilter) =>
        notifyPromise(
            createMutation.mutateAsync(data, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                },
            }),
            'filterCreate',
        );

    const toggleFilterStar = (data: ToggleSubscription) =>
        notifyPromise(
            toggleMutation.mutateAsync(data, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                    utils.filter.getById.invalidate();
                },
            }),
            data.direction ? 'filterStar' : 'filterUnstar',
        );

    const deleteFilter = (id: string) =>
        notifyPromise(
            deleteMutation.mutateAsync(id, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                },
            }),
            'filterDelete',
        );

    return {
        createFilter,
        toggleFilterStar,
        deleteFilter,
    };
};
