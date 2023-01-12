import { useCallback } from 'react';
import toast from 'react-hot-toast';
import z from 'zod';

import { Goal } from '../../graphql/@generated/genql';
import { gql } from '../utils/gql';

type KeySet = (key: string) => string;
type Callback<A = []> = (...args: A[]) => void;

export const useGoalResource = (id: string) => {
    const toggleGoalWatching = useCallback(
        (cb: Callback, t: KeySet, watcher?: boolean) => async () => {
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
                error: t('Something went wrong 😿'),
                loading: t('We are calling owner'),
                success: t(!watcher ? 'Voila! You are watcher now 🎉' : 'So sad! Goal will miss you'),
            });

            cb();

            await promise;
        },
        [id],
    );

    const toggleGoalStar = useCallback(
        (cb: Callback, t: KeySet, stargizer?: boolean) => async () => {
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
                error: t('Something went wrong 😿'),
                loading: t('We are calling owner'),
                success: t(!stargizer ? 'Voila! You are stargizer now 🎉' : 'So sad! Goal will miss you'),
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
