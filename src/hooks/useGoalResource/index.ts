import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { gql } from '../../utils/gql';

import { tr } from './useGoalResource.i18n';

type Callback<A = []> = (...args: A[]) => void;

export const useGoalResource = (id: string) => {
    const toggleGoalWatching = useCallback(
        (cb: Callback, watcher?: boolean) => async () => {
            const promise = gql.mutation({
                toggleGoalWatcher: [
                    {
                        data: {
                            id,
                            direction: !watcher,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are calling owner'),
                success: !watcher ? tr('Voila! You are watcher now 🎉') : tr('So sad! Goal will miss you'),
            });

            cb();

            await promise;
        },
        [id],
    );

    const toggleGoalStar = useCallback(
        (cb: Callback, stargizer?: boolean) => async () => {
            const promise = gql.mutation({
                toggleGoalStargizer: [
                    {
                        data: {
                            id,
                            direction: !stargizer,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are calling owner'),
                success: !stargizer ? tr('Voila! You are stargizer now 🎉') : tr('So sad! Goal will miss you'),
            });

            cb();

            await promise;
        },
        [id],
    );

    return {
        toggleGoalWatching,
        toggleGoalStar,
    };
};
