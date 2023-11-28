import React, { useState, useRef, useMemo, useCallback } from 'react';
import { KeyCode, MenuItem, Popup, nullable, useClickOutside, useKeyboard } from '@taskany/bricks';
import { IconPlusCircleOutline } from '@taskany/icons';
import styled from 'styled-components';

import { trpc } from '../../utils/trpcClient';
import { InlineTrigger } from '../InlineTrigger';
import { CriteriaForm } from '../CriteriaForm/CriteriaForm';
import { GoalBadge } from '../GoalBadge';

import { tr } from './GoalCriteriaSuggest.i18n';

type CriteriaFormValues = Parameters<React.ComponentProps<typeof CriteriaForm>['onSubmit']>[0];

interface GoalCriteriaComboBoxProps {
    onSubmit: (values: CriteriaFormValues) => Promise<void>;
    checkGoalsBindingsFor: (selectedGoalId: string) => Promise<void>;
}

const StyledPopup = styled(Popup)`
    pointer-events: all;
`;

export const GoalCriteriaComboBox: React.FC<GoalCriteriaComboBoxProps> = ({ onSubmit, checkGoalsBindingsFor }) => {
    const [popupVisible, setPopupVisible] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState<string | void>('');
    const [selectedGoal, setSelectedGoal] = useState<{ id: string; title: string; stateColor?: number } | void>();

    const [{ data: goals = [] }, { data: criteriaList = [] }] = trpc.useQueries((ctx) => [
        ctx.goal.suggestions(
            {
                input: query as string,
                limit: 5,
                onlyCurrentUser: true,
            },
            { enabled: query != null && query.length > 2 },
        ),
        ctx.goal.getGoalCriteriaList(
            {
                id: selectedGoal?.id,
            },
            { enabled: selectedGoal != null },
        ),
    ]);

    const hidePopup = useCallback(() => {
        if (popupVisible) {
            setPopupVisible(false);
        }
    }, [popupVisible]);

    const [onESC] = useKeyboard([KeyCode.Escape], hidePopup);

    useClickOutside(formRef, hidePopup);

    const itemsToRender = useMemo(() => {
        if (selectedGoal?.title === query) {
            return [];
        }

        return goals.map(({ id, title, state }) => ({
            id,
            title,
            stateColor: state?.hue,
        }));
    }, [goals, selectedGoal, query]);

    const validityData = useMemo(() => {
        return criteriaList.reduce<{ sumOfCriteria: number; title: string[] }>(
            (acc, { weight, title, criteriaGoal }) => {
                acc.sumOfCriteria += weight;
                acc.title.push(criteriaGoal?.title ?? title);
                return acc;
            },
            {
                sumOfCriteria: 0,
                title: [],
            },
        );
    }, [criteriaList]);

    const handleGoalChange = useCallback((item: typeof selectedGoal) => {
        setSelectedGoal(item);
        setQuery(item?.title);
    }, []);

    const handleSubmit = useCallback(
        async (values: CriteriaFormValues) => {
            await onSubmit(values);

            hidePopup();
        },
        [onSubmit, hidePopup],
    );

    return (
        <>
            <InlineTrigger
                icon={<IconPlusCircleOutline size="s" />}
                text={tr('Connect to goal')}
                onClick={() => setPopupVisible((prev) => !prev)}
                ref={triggerRef}
            />
            <StyledPopup
                reference={triggerRef}
                visible={popupVisible}
                placement="bottom"
                {...onESC}
                minWidth={400}
                maxWidth={400}
            >
                {nullable(popupVisible, () => (
                    <CriteriaForm
                        ref={formRef}
                        defaultMode="goal"
                        onInputChange={setQuery}
                        onItemChange={handleGoalChange}
                        onSubmit={handleSubmit}
                        onCancel={hidePopup}
                        items={itemsToRender}
                        validityData={validityData}
                        validateBindingsFor={checkGoalsBindingsFor}
                        renderItem={(props) => (
                            <MenuItem
                                ghost
                                focused={props.active || props.hovered}
                                onClick={props.onItemClick}
                                onMouseMove={props.onMouseMove}
                                onMouseLeave={props.onMouseLeave}
                            >
                                <GoalBadge title={props.item.title} color={props.item.stateColor} theme={1} />
                            </MenuItem>
                        )}
                    />
                ))}
            </StyledPopup>
        </>
    );
};
