import React, { useState, useMemo, useCallback } from 'react';

import { trpc } from '../utils/trpcClient';

import { CriteriaForm } from './CriteriaForm/CriteriaForm';

interface Goal {
    id: string;
    title: string;
    state?: { hue?: number } | null;
}

interface GoalCriteriaComboBoxProps {
    id: string;
    items?: {
        goal?: Goal | null;
    }[];
    versa?: boolean;
    editMode?: boolean;
    /** Value allows restrict search results by current user */
    restrictedSearch?: boolean;
    withModeSwitch?: React.ComponentProps<typeof CriteriaForm>['withModeSwitch'];
    defaultMode?: React.ComponentProps<typeof CriteriaForm>['mode'];
    values?: React.ComponentProps<typeof CriteriaForm>['values'];
    onSubmit: React.ComponentProps<typeof CriteriaForm>['onSubmit'];
    validateGoalCriteriaBindings: (values: { goalId: string; criteriaGoalId: string }) => Promise<null>;
}

export const GoalCriteriaSuggest: React.FC<GoalCriteriaComboBoxProps> = ({
    id,
    items,
    withModeSwitch,
    defaultMode = 'simple',
    versa,
    editMode,
    values,
    onSubmit,
    validateGoalCriteriaBindings,
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

    const [{ data: goals = [] }, { data: criteriaList = [] }] = trpc.useQueries((ctx) => [
        ctx.goal.suggestions(
            {
                input: query as string,
                limit: 5,
                onlyCurrentUser: restrictedSearch,
            },
            { enabled: mode === 'goal' && !editMode, cacheTime: 0 },
        ),
        ctx.goal.getGoalCriteriaList(
            {
                id: versa ? selectedGoal?.id : id,
            },
            { cacheTime: 0, enabled: versa ? selectedGoal?.id != null : !!id },
        ),
    ]);

    const itemsToRender = useMemo(() => {
        if (selectedGoal?.title === query || mode === 'simple') {
            return [];
        }

        return goals.map(({ id, title, state }) => ({
            id,
            title,
            stateColor: state?.hue,
        }));
    }, [goals, selectedGoal, query, mode]);

    const validityData = useMemo(() => {
        return criteriaList.reduce<{ sumOfCriteria: number; title: string[] }>(
            (acc, { weight, title, id }) => {
                if (values?.id === id) {
                    return acc;
                }

                acc.sumOfCriteria += weight;
                acc.title.push(title);
                return acc;
            },
            {
                sumOfCriteria: 0,
                title: [],
            },
        );
    }, [criteriaList, values]);

    const handleGoalChange = useCallback((item: typeof selectedGoal) => {
        setSelectedGoal(item);
        setQuery(item?.title);
    }, []);

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
