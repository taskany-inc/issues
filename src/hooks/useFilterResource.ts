import { notifyPromise } from '../utils/notifyPromise';
import { CreateFilter, ToggleStargizer } from '../schema/filter';
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
            {
                onPending: 'We are saving your filter...',
                onSuccess: 'Voila! Saved successfully 🎉! Use and share it with teammates 😉',
                onError: 'Something went wrong 😿',
            },
        );

    const toggleFilterStar = (data: ToggleStargizer) =>
        notifyPromise(
            toggleMutation.mutateAsync(data, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                },
            }),
            {
                onPending: 'We are calling owner...',
                onSuccess: data.direction ? 'Voila! You are stargizer now 🎉' : 'So sad! We will miss you',
                onError: 'Something went wrong 😿',
            },
        );

    const deleteFilter = (id: string) =>
        notifyPromise(
            deleteMutation.mutateAsync(id, {
                onSuccess: () => {
                    utils.filter.getUserFilters.invalidate();
                },
            }),
            {
                onPending: 'We are deleting your filter...',
                onSuccess: 'Deleted successfully 🎉!',
                onError: 'Something went wrong 😿',
            },
        );

    return {
        createFilter,
        toggleFilterStar,
        deleteFilter,
    };
};
