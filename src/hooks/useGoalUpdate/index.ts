import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { trpc } from '../../utils/trpcClient';
import { GoalUpdate } from '../../schema/goal';

import { tr } from './useGoalUpdate.i18n';

export const useGoalUpdate = (id?: string) => {
    const updateMutation = trpc.goal.update.useMutation();

    return useCallback(
        (data: Omit<GoalUpdate, 'id'>) => {
            if (!id) return;

            const promise = updateMutation.mutateAsync({
                ...data,
                id,
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are updating the goal'),
                success: tr('Voila! Goal is up to date 🎉'),
            });

            return promise;
        },
        [id, updateMutation],
    );
};
