import { useCallback, useEffect, useState } from 'react';

import { trpc } from '../utils/trpcClient';
import { AddCriteriaScheme, RemoveCriteriaScheme, UpdateCriteriaScheme } from '../schema/criteria';

export const useCriteriaResource = (invalidateFn: () => Promise<any>) => {
    const [query, setQuery] = useState('');
    const add = trpc.goal.addCriteria.useMutation();
    const toggle = trpc.goal.updateCriteriaState.useMutation();
    const remove = trpc.goal.removeCriteria.useMutation();

    const goals = trpc.goal.suggestions.useQuery(query, {
        enabled: query.length > 2,
        staleTime: 0,
        cacheTime: 0,
    });

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

    useEffect(() => {
        if (query === '') {
            goals.remove();
        }
    }, [goals, query]);

    return {
        onAddHandler,
        onToggleHandler,
        onRemoveHandler,
        updateSuggestionQuery: setQuery,
        goals,
    };
};
