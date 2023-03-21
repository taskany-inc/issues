import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { Goal, GoalUpdateInput } from '../../../graphql/@generated/genql';
import { gql } from '../../utils/gql';

import { tr } from './useGoalUpdate.i18n';

export const useGoalUpdate = (goal: Goal) => {
    return useCallback(
        (data: Partial<GoalUpdateInput>) => {
            const promise = gql.mutation({
                updateGoal: [
                    {
                        data: {
                            ...data,
                            id: goal.id,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are updating the goal'),
                success: tr('Voila! Goal is up to date 🎉'),
            });

            return promise;
        },
        [goal],
    );
};
