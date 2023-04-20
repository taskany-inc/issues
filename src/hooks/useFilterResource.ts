import { gql } from '../utils/gql';
import { notifyPromise } from '../utils/notifyPromise';
import { CreateFormType } from '../schema/filter';
import { FilterInput } from '../../graphql/@generated/genql';

export const useFilterResource = () => {
    const createFilter = (data: CreateFormType) =>
        notifyPromise(
            gql.mutation({
                createFilter: [
                    {
                        data,
                    },
                    {
                        id: true,
                    },
                ],
            }),
            {
                onPending: 'We are saving your filter...',
                onSuccess: 'Voila! Saved successfully 🎉! Use and share it with teammates 😉',
                onError: 'Something went wrong 😿',
            },
        );

    const deleteFilter = (data: FilterInput) =>
        notifyPromise(
            gql.mutation({
                deleteFilter: [
                    {
                        data,
                    },
                    {
                        id: true,
                    },
                ],
            }),
            {
                onPending: 'We are deleting your filter...',
                onSuccess: 'Deleted successfully 🎉!',
                onError: 'Something went wrong 😿',
            },
        );

    return {
        createFilter,
        deleteFilter,
    };
};
