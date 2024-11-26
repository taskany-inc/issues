import React, { useState, useMemo, useCallback } from 'react';

import { trpc } from '../utils/trpcClient';
import { useGoalResource } from '../hooks/useGoalResource';

import { CriteriaForm, useCriteriaValidityData } from './CriteriaForm/CriteriaForm';
import { dispatchPreviewUpdateEvent } from './GoalPreview/GoalPreviewProvider';
import { getStateProps } from './GoalBadge';

type SuggestItems = React.ComponentProps<typeof CriteriaForm>['items'];

interface Goal {
    id: string;
    title: string;
    state?: Record<string, unknown> | null;
    _shortId: string;
}

interface Task {
    id: string;
    title: string;
    taskKey: string;
    type?: Record<string, unknown> | null;
    state?: Record<string, unknown> | null;
    project: string;
}

interface GoalCriteriaSuggestProps {
    id: string;
    items?: {
        goal?: Goal | null;
        task?: Task | null;
    }[];
    filter?: string[];
    versa?: boolean;
    /** Value allows restrict search results by current user */
    restrictedSearch?: boolean;
    externalAllowed?: boolean;
    withModeSwitch?: React.ComponentProps<typeof CriteriaForm>['withModeSwitch'];
    defaultMode?: React.ComponentProps<typeof CriteriaForm>['mode'];
    values?: React.ComponentProps<typeof CriteriaForm>['values'];
    onSubmit: React.ComponentProps<typeof CriteriaForm>['onSubmit'];
    validateGoalCriteriaBindings: (values: { goalId: string; criteriaGoalId: string }) => Promise<null>;
    validityData: React.ComponentProps<typeof CriteriaForm>['validityData'];
    onGoalSelect?: (goal: { id: string }) => void;
}
type SuggestItem = React.ComponentProps<typeof CriteriaForm>['items'][number];

export const GoalCriteriaSuggest: React.FC<GoalCriteriaSuggestProps> = ({
    id,
    filter,
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
    externalAllowed = false,
}) => {
    const [mode, setMode] = useState(defaultMode);
    const [query, setQuery] = useState<string | void>('');
    const [selectedGoal, setSelectedGoal] = useState<{ id: string; title: string; stateColor?: number } | void>(
        values?.selected,
    );

    const shouldEnabledQuery = query != null && query.length > 0 && selectedGoal?.title !== query;

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
            filter,
        },
        { enabled: mode === 'goal' && shouldEnabledQuery, cacheTime: 0 },
    );

    const { data: issues = [] } = trpc.jira.search.useQuery(
        {
            value: query as string,
            limit: 5,
        },
        {
            enabled: mode === 'task' && shouldEnabledQuery,
            keepPreviousData: true,
        },
    );

    const itemsToRender = useMemo<SuggestItem[]>(() => {
        if (selectedGoal?.title === query || mode === 'simple') {
            return [];
        }

        if (mode === 'goal') {
            return goals.map(({ id, title, state, _shortId }) => ({
                id,
                title,
                state: getStateProps(state),
                _shortId,
                itemType: 'goal',
            }));
        }

        return issues.map((issue) => ({
            ...issue,
            taskKey: issue.externalKey,
            state: null,
            id: issue.externalId,
            title: issue.title,
            type: {
                title: issue.type,
                src: issue.typeIconUrl,
            },
            itemType: 'task' as const,
        }));
    }, [goals, selectedGoal, query, mode, issues]);

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
            value={selectedGoals as SuggestItems}
            values={values}
            withModeSwitch={withModeSwitch}
            onInputChange={setQuery}
            onItemChange={handleGoalChange}
            onSubmit={onSubmit}
            onReset={handleReset}
            items={itemsToRender}
            validityData={validityData}
            validateBindingsFor={validateBindings}
            externalAllowed={externalAllowed}
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

    const { data: childrenIds = [] } = trpc.v2.goal.getChildrenIds.useQuery([goalId]);

    return (
        <GoalCriteriaSuggest
            id={goalId}
            defaultMode="goal"
            items={items}
            onSubmit={handleConnectGoal}
            validateGoalCriteriaBindings={validateGoalCriteriaBindings}
            versa
            restrictedSearch
            filter={[goalId, ...childrenIds.map(({ id }) => id).filter(Boolean)]}
            validityData={validityData}
            onGoalSelect={({ id }) => setSelectedGoalId(id)}
        />
    );
};
