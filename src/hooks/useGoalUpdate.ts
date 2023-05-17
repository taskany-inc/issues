import { useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { GoalUpdate } from '../schema/goal';
import { notifyPromise } from '../utils/notifyPromise';

export const useGoalUpdate = (id?: string) => {
    const updateMutation = trpc.goal.update.useMutation();

    return useCallback(
        (data: Omit<GoalUpdate, 'id'>) => {
            if (!id) return;

            const promise = updateMutation.mutateAsync({
                ...data,
                id,
            });

            notifyPromise(promise, 'goalsUpdate');

            return promise;
        },
        [id, updateMutation],
    );
};
