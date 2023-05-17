import { useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { notifyPromise } from '../utils/notifyPromise';

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

            notifyPromise(promise, !watcher ? 'goalsWatch' : 'goalsUnwatch');

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

            notifyPromise(promise, !stargizer ? 'goalsStar' : 'goalsUnstar');

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
