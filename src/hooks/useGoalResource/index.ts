import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { trpc } from '../../utils/trpcClient';

import { tr } from './useGoalResource.i18n';

type Callback<A = []> = (...args: A[]) => void;

export const useGoalResource = (id: string) => {
    const toggleWatcherMutation = trpc.goal.toggleWatcher.useMutation();
    const toggleStargizerMutation = trpc.goal.toggleStargizer.useMutation();

    const toggleGoalWatching = useCallback(
        (cb: Callback, watcher?: boolean) => async () => {
            const promise = toggleWatcherMutation.mutateAsync({
                id,
                direction: !watcher,
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are calling owner'),
                success: !watcher ? tr('Voila! You are watcher now 🎉') : tr('So sad! Goal will miss you'),
            });

            cb();

            await promise;
        },
        [id, toggleWatcherMutation],
    );

    const toggleGoalStar = useCallback(
        (cb: Callback, stargizer?: boolean) => async () => {
            const promise = toggleStargizerMutation.mutateAsync({
                id,
                direction: !stargizer,
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are calling owner'),
                success: !stargizer ? tr('Voila! You are stargizer now 🎉') : tr('So sad! Goal will miss you'),
            });

            cb();

            await promise;
        },
        [id, toggleStargizerMutation],
    );

    return {
        toggleGoalWatching,
        toggleGoalStar,
    };
};
