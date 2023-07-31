import { useCallback } from 'react';
import { GoalAchieveCriteria } from '@prisma/client';

import { trpc } from '../utils/trpcClient';
import {
    AddCriteriaScheme,
    RemoveCriteriaScheme,
    UpdateCriteriaScheme,
    UpdateCriteriaStateScheme,
} from '../schema/criteria';
import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';

export const useCriteriaResource = (invalidateFn: () => Promise<unknown>) => {
    const add = trpc.goal.addCriteria.useMutation();
    const toggle = trpc.goal.updateCriteriaState.useMutation();
    const update = trpc.goal.updateCriteria.useMutation();
    const remove = trpc.goal.removeCriteria.useMutation();
    const convert = trpc.goal.convertCriteriaToGoal.useMutation();

    const onAddHandler = useCallback(
        async (val: AddCriteriaScheme) => {
            await add.mutateAsync(val);
            invalidateFn();
        },
        [add, invalidateFn],
    );

    const onToggleHandler = useCallback(
        async (val: UpdateCriteriaStateScheme) => {
            await toggle.mutateAsync(val);
            invalidateFn();
        },
        [invalidateFn, toggle],
    );

    const onUpdateHandler = useCallback(
        async (val: UpdateCriteriaScheme) => {
            await update.mutateAsync(val);
            invalidateFn();
        },
        [invalidateFn, update],
    );

    const onRemoveHandler = useCallback(
        async (val: RemoveCriteriaScheme) => {
            await remove.mutateAsync(val);
            invalidateFn();
        },
        [invalidateFn, remove],
    );

    const onConvertCriteria = useCallback(
        (val: GoalAchieveCriteria) => {
            dispatchModalEvent(ModalEvent.GoalCreateModal, {
                title: val.title,
                onGoalCreate: async (createdGoal) => {
                    if (createdGoal) {
                        await convert.mutateAsync({
                            title: createdGoal?.title,
                            id: val.id,
                            goalAsCriteria: {
                                id: createdGoal.id,
                            },
                        });

                        invalidateFn();
                    }
                },
            })();
        },
        [convert, invalidateFn],
    );

    return {
        onAddHandler,
        onToggleHandler,
        onRemoveHandler,
        onConvertCriteria,
        onUpdateHandler,
    };
};
