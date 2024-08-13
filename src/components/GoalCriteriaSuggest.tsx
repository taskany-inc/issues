import React, { useState, useMemo, useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { State } from '../../trpc/inferredTypes';
import { useGoalResource } from '../hooks/useGoalResource';

import { CriteriaForm, useCriteriaValidityData } from './CriteriaForm/CriteriaForm';
import { dispatchPreviewUpdateEvent } from './GoalPreview/GoalPreviewProvider';

interface Goal {
    id: string;
    title: string;
    state?: State | null;
    _shortId: string;
}

interface GoalCriteriaSuggestProps {
    id: string;
    items?: {
        goal?: Goal | null;
    }[];
    versa?: boolean;
    /** Value allows restrict search results by current user */
    restrictedSearch?: boolean;
    withModeSwitch?: React.ComponentProps<typeof CriteriaForm>['withModeSwitch'];
    defaultMode?: React.ComponentProps<typeof CriteriaForm>['mode'];
    values?: React.ComponentProps<typeof CriteriaForm>['values'];
    onSubmit: React.ComponentProps<typeof CriteriaForm>['onSubmit'];
    validateGoalCriteriaBindings: (values: { goalId: string; criteriaGoalId: string }) => Promise<null>;
    validityData: React.ComponentProps<typeof CriteriaForm>['validityData'];
    onGoalSelect?: (goal: { id: string }) => void;
}

export const GoalCriteriaSuggest: React.FC<GoalCriteriaSuggestProps> = ({
    id,
    items,
    withModeSwitch,
    defaultMode = 'simple',
    versa,
    values,
    onSubmit,
    validateGoalCriteriaBindings,
    validityData,
    onGoalSelect,
    restrictedSearch = false,
}) => {
    const [mode, setMode] = useState(defaultMode);
    const [query, setQuery] = useState<string | void>('');
    const [selectedGoal, setSelectedGoal] = useState<{ id: string; title: string; stateColor?: number } | void>(
        values?.selected,
    );

    const selectedGoals = useMemo(() => {
        return items?.reduce<Goal[]>((acc, { goal }) => {
            if (goal) {
                acc.push(goal);
            }
            return acc;
        }, []);
    }, [items]);

    const { data: goals = [] } = trpc.goal.suggestions.useQuery(
        {
            input: query as string,
            limit: 5,
            onlyCurrentUser: restrictedSearch,
        },
        { enabled: mode === 'goal', cacheTime: 0 },
    );

    const itemsToRender = useMemo(() => {
        if (selectedGoal?.title === query || mode === 'simple') {
            return [];
        }

        return goals.map(({ id, title, state, _shortId }) => ({
            id,
            title,
            state,
            _shortId,
        }));
    }, [goals, selectedGoal, query, mode]);

    const handleGoalChange = useCallback(
        (item: typeof selectedGoal) => {
            setSelectedGoal(item);

            if (item?.title != null) {
                setQuery(item.title);
                onGoalSelect?.(item);
            }
        },
        [onGoalSelect],
    );

    const validateBindings = useCallback(
        (selectedId: string) => {
            const data = versa
                ? {
                      goalId: selectedId,
                      criteriaGoalId: id,
                  }
                : {
                      goalId: id,
                      criteriaGoalId: selectedId,
                  };

            return validateGoalCriteriaBindings(data);
        },
        [id, versa, validateGoalCriteriaBindings],
    );

    const handleReset = useCallback(() => {
        setQuery('');
        setSelectedGoal(values?.selected);
        setMode(defaultMode);
    }, [values, defaultMode]);

    return (
        <CriteriaForm
            mode={mode}
            setMode={setMode}
            values={values}
            withModeSwitch={withModeSwitch}
            onInputChange={setQuery}
            onItemChange={handleGoalChange}
            onSubmit={onSubmit}
            onReset={handleReset}
            items={itemsToRender}
            value={selectedGoals}
            validityData={validityData}
            validateBindingsFor={validateBindings}
        />
    );
};

interface VersaCriteriaSuggestProps {
    goalId: string;
    goalShortId: string;
    items: React.ComponentProps<typeof GoalCriteriaSuggest>['items'];
}

export const VersaCriteriaSuggest: React.FC<VersaCriteriaSuggestProps> = ({ goalId, items, goalShortId }) => {
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

    const { data = [] } = trpc.goal.getGoalCriteriaList.useQuery(
        {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: selectedGoalId!,
        },
        { enabled: !!selectedGoalId },
    );
    const { validateGoalCriteriaBindings, onGoalCriteriaAdd } = useGoalResource(
        {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: selectedGoalId!,
        },
        {
            invalidate: {
                getById: goalShortId,
                getGoalActivityFeed: { goalId },
            },
            afterInvalidate: dispatchPreviewUpdateEvent,
        },
    );

    const handleConnectGoal = useCallback(
        async (values: { title?: string; selected?: { id: string } | null; weight?: string }) => {
            if (values.title && values.selected) {
                await onGoalCriteriaAdd({
                    title: values.title,
                    goalId: values.selected.id,
                    weight: values.weight,
                    criteriaGoal: {
                        id: goalId,
                    },
                });
            }
        },
        [goalId, onGoalCriteriaAdd],
    );

    const validityData = useCriteriaValidityData(data);

    return (
        <GoalCriteriaSuggest
            id={goalId}
            defaultMode="goal"
            items={items}
            onSubmit={handleConnectGoal}
            validateGoalCriteriaBindings={validateGoalCriteriaBindings}
            versa
            restrictedSearch
            validityData={validityData}
            onGoalSelect={({ id }) => setSelectedGoalId(id)}
        />
    );
};
