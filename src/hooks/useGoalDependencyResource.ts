import { useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { ToggleGoalDependency } from '../schema/goal';
import { notifyPromise } from '../utils/notifyPromise';

export const useGoalDependencyResource = (invalidateFn: () => Promise<unknown>) => {
    const add = trpc.goal.addDependency.useMutation();
    const remove = trpc.goal.removeDependency.useMutation();

    const onAddHandler = useCallback(
        async (val: ToggleGoalDependency) => {
            await notifyPromise(add.mutateAsync(val), 'goalsUpdate');
            invalidateFn();
        },
        [invalidateFn, add],
    );

    const onRemoveHandler = useCallback(
        async (val: ToggleGoalDependency) => {
            await notifyPromise(remove.mutateAsync(val), 'goalsUpdate');
            invalidateFn();
        },
        [invalidateFn, remove],
    );

    return {
        onAddHandler,
        onRemoveHandler,
    };
};
