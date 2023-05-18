import { useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { notifyPromise } from '../utils/notifyPromise';

export const useGoalResource = (id: string) => {
    const utils = trpc.useContext();
    const toggleWatcherMutation = trpc.goal.toggleWatcher.useMutation();
    const toggleStargizerMutation = trpc.goal.toggleStargizer.useMutation();

    const invalidate = useCallback(() => {
        utils.goal.getById.invalidate(id);
    }, [id, utils.goal.getById]);

    const toggleGoalWatching = useCallback(
        async (watcher?: boolean) => {
            await notifyPromise(
                toggleWatcherMutation.mutateAsync({
                    id,
                    direction: !watcher,
                }),
                !watcher ? 'goalsWatch' : 'goalsUnwatch',
            );

            invalidate();
        },
        [id, toggleWatcherMutation, invalidate],
    );

    const toggleGoalStar = useCallback(
        async (stargizer?: boolean) => {
            await notifyPromise(
                toggleStargizerMutation.mutateAsync({
                    id,
                    direction: !stargizer,
                }),
                !stargizer ? 'goalsStar' : 'goalsUnstar',
            );

            invalidate();
        },
        [id, toggleStargizerMutation, invalidate],
    );

    return {
        toggleGoalWatching,
        toggleGoalStar,
    };
};
