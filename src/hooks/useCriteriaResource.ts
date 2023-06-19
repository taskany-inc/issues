import { useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { AddCriteriaScheme, RemoveCriteriaScheme, UpdateCriteriaScheme } from '../schema/criteria';

export const useCriteriaResource = (invalidateFn: () => Promise<unknown>) => {
    const add = trpc.goal.addCriteria.useMutation();
    const toggle = trpc.goal.updateCriteriaState.useMutation();
    const remove = trpc.goal.removeCriteria.useMutation();

    const onAddHandler = useCallback(
        async (val: AddCriteriaScheme) => {
            await add.mutateAsync(val);
            invalidateFn();
        },
        [add, invalidateFn],
    );

    const onToggleHandler = useCallback(
        async (val: UpdateCriteriaScheme) => {
            await toggle.mutateAsync(val);
            invalidateFn();
        },
        [invalidateFn, toggle],
    );

    const onRemoveHandler = useCallback(
        async (val: RemoveCriteriaScheme) => {
            await remove.mutateAsync(val);
            invalidateFn();
        },
        [invalidateFn, remove],
    );

    return {
        onAddHandler,
        onToggleHandler,
        onRemoveHandler,
    };
};
