import { useCallback } from 'react';
import toast from 'react-hot-toast';

import { Goal, GoalUpdateInput } from '../../graphql/@generated/genql';
import { gql } from '../utils/gql';

export const useGoalUpdate = (t: (k: string) => string, goal: Goal) => {
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
                error: t('Something went wrong 😿'),
                loading: t('We are updating the goal'),
                success: t('Voila! Goal is up to date 🎉'),
            });

            return promise;
        },
        [t, goal],
    );
};
