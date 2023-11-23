import React, { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { Text, nullable, Table, MenuItem, TableRow, TableCell, Dropdown } from '@taskany/bricks';
import {
    IconTargetOutline,
    IconCircleOutline,
    IconMessageTickOutline,
    IconTickCircleOutline,
    IconBinOutline,
    IconEdit1Outline,
    IconPlusCircleOutline,
    IconMoreVerticalOutline,
} from '@taskany/icons';
import { backgroundColor, brandColor, gray10, danger0, gray8, gray9, gray4, gapS, gapXs } from '@taskany/colors';

import { ActivityFeedItem } from '../ActivityFeed';
import { Circle } from '../Circle';
import { CriteriaForm } from '../CriteriaFormV2/CriteriaForm';
import { GoalBadge } from '../GoalBadge';
import { Box } from '../Box';
import { trpc } from '../../utils/trpcClient';
import { InlineTrigger } from '../InlineTrigger';
import { Badge } from '../Badge';

import { tr } from './GoalCriteria.i18n';

const StyledWrapper = styled.div`
    display: grid;
    grid-template-columns: 70%;
    grid-template-rows: minmax(32px, 100%);
    align-items: center;
    gap: ${gapS};
`;

const StyledCircleIcon = styled(IconCircleOutline)`
    color: ${gray8};

    &:hover {
        color: ${gray10};
    }
`;

const StyledTickIcon = styled(IconTickCircleOutline)`
    color: ${brandColor};
    fill: ${backgroundColor};
`;

const StyledCheckboxWrapper = styled.span<{ canEdit: boolean }>`
    display: inline-flex;
    cursor: pointer;

    ${({ canEdit }) =>
        !canEdit &&
        css`
            pointer-events: none;
            cursor: default;
        `}
`;

interface CriteriaActionItem {
    label: string;
    handler: () => void;
    color?: string;
    icon: React.ReactNode;
}

interface GoalCriteriaCheckBoxProps {
    checked: boolean;
    canEdit: boolean;
    onClick: () => void;
}

const GoalCriteriaCheckBox: React.FC<GoalCriteriaCheckBoxProps> = ({ checked, canEdit, onClick }) => {
    const Icon = !checked ? StyledCircleIcon : StyledTickIcon;
    return (
        <StyledCheckboxWrapper onClick={onClick} canEdit={canEdit}>
            <Icon size="s" />
        </StyledCheckboxWrapper>
    );
};

const StyledTextHeading = styled(Text)`
    border-bottom: 1px solid ${gray4};
`;

const StyledIconTableCell = styled(TableCell)`
    padding-top: calc(${gapXs} + 5px); // offset by input vertical center
`;

const StyledBadge = styled(Badge)`
    padding: 0;
`;

const StyledGoalBadge = styled(GoalBadge)`
    padding: 0;
`;

const useGoalSuggestions = (value = '') => {
    const [query, setQuery] = useState(() => value);

    const { data: suggestions } = trpc.goal.suggestions.useQuery(
        {
            input: query,
            limit: 5,
        },
        {
            staleTime: 0,
            cacheTime: 0,
        },
    );

    return [suggestions, setQuery] as [typeof suggestions, React.Dispatch<React.SetStateAction<string>>];
};

type CriteriaFormData = NonNullable<React.ComponentProps<typeof CriteriaForm>['values']>;
type CriteriaValidityData = React.ComponentProps<typeof CriteriaForm>['validityData'];

interface CriteriaItemValue {
    id: string;
    title: string;
    weight: number;
    isDone: boolean;
    criteriaGoal?: {
        id: string;
        title: string;
        href: string;
        stateColor?: number;
    } | null;
}

interface CriteriaItemProps {
    criteria: CriteriaItemValue;
    canEdit: boolean;
    onClick: (value: CriteriaItemValue) => void;
    onUpdateState: (value: CriteriaItemValue) => void;
    onRemove: (value: CriteriaItemValue) => void;
    onConvertGoal: (value: CriteriaItemValue) => void;
    onCancel: () => void;
    renderForm: (props: { onEditCancel: () => void }) => React.ReactNode;
}

const calculateModeCriteria = (props: CriteriaItemValue) => {
    // as pre added criteria
    if (props.title === '') {
        return 'edit';
    }

    return 'view';
};

const CriteriaItem: React.FC<CriteriaItemProps> = ({
    criteria,
    canEdit,
    onUpdateState,
    onConvertGoal,
    onRemove,
    onCancel,
    onClick,
    renderForm,
}) => {
    const { criteriaGoal, title } = criteria;
    const [mode, setMode] = useState<'view' | 'edit'>(() => calculateModeCriteria(criteria));

    const availableActions = useMemo<CriteriaActionItem[] | undefined>(() => {
        if (!canEdit) {
            return;
        }

        const actions: CriteriaActionItem[] = [
            {
                label: 'Edit',
                icon: <IconEdit1Outline size="xxs" />,
                handler: () => setMode('edit'),
            },
        ];

        if (!criteriaGoal && onConvertGoal) {
            actions.push({
                label: tr('Create as goal'),
                icon: <IconTargetOutline size="xxs" />,
                handler: () => onConvertGoal(criteria),
            });
        }

        actions.push({
            label: tr('Delete'),
            icon: <IconBinOutline size="xxs" />,
            color: danger0,
            handler: () => onRemove(criteria),
        });

        return actions;
    }, [canEdit, criteria, criteriaGoal, onConvertGoal, onRemove]);

    const handleChange = useCallback((val: CriteriaActionItem) => {
        val.handler();
    }, []);

    const handleCancel = useCallback(() => {
        if (criteria.title === '') {
            onCancel();
        } else {
            setMode('view');
        }
    }, [criteria.title, onCancel]);

    return (
        <TableRow gap={5} align="start">
            {nullable(
                mode === 'edit',
                () => (
                    <>
                        <StyledIconTableCell width="16px">
                            <StyledCircleIcon size="s" />
                        </StyledIconTableCell>
                        <TableCell width="calc(100% - 16px)">{renderForm({ onEditCancel: handleCancel })}</TableCell>
                    </>
                ),
                <>
                    <TableCell width="calc(100% - 5ch)" align="baseline">
                        {nullable(
                            criteriaGoal,
                            (goal) => (
                                <StyledGoalBadge
                                    title={goal.title}
                                    color={goal.stateColor}
                                    theme={1}
                                    href={goal.href}
                                    onClick={() => onClick(criteria)}
                                />
                            ),
                            <StyledBadge
                                icon={
                                    <GoalCriteriaCheckBox
                                        checked={criteria.isDone}
                                        canEdit={canEdit}
                                        onClick={() => onUpdateState({ ...criteria, isDone: !criteria.isDone })}
                                    />
                                }
                                text={title}
                            />,
                        )}
                    </TableCell>
                    <TableCell width="3ch" justify="end" align="start">
                        {nullable(criteria.weight > 0, () => (
                            <Text size="s" color={gray9}>
                                {criteria.weight}
                            </Text>
                        ))}
                    </TableCell>
                    <TableCell min align="baseline">
                        <Dropdown
                            onChange={handleChange}
                            renderTrigger={({ onClick }) => <IconMoreVerticalOutline size="xs" onClick={onClick} />}
                            placement="right"
                            items={availableActions}
                            renderItem={(props) => (
                                <MenuItem
                                    key={props.index}
                                    onClick={props.onClick}
                                    icon={props.item.icon}
                                    ghost
                                    color={props.item.color}
                                >
                                    {props.item.label}
                                </MenuItem>
                            )}
                        />
                    </TableCell>
                </>,
            )}
        </TableRow>
    );
};

interface CriteriaActionFn<T> {
    (val: T): void;
}

interface GoalCriteriaProps {
    list: CriteriaItemValue[];
    canEdit: boolean;
    onGoalClick: CriteriaActionFn<CriteriaItemValue>;
    onCreate: CriteriaActionFn<Required<CriteriaFormData>>;
    onUpdate: CriteriaActionFn<Required<CriteriaFormData>>;
    onRemove: CriteriaActionFn<CriteriaItemValue>;
    onUpdateState: CriteriaActionFn<CriteriaItemValue>;
    onConvertToGoal: CriteriaActionFn<CriteriaItemValue>;
    onClick?: CriteriaActionFn<CriteriaItemValue>;
    validateGoalCriteriaBindings: (selectedGoalId: string) => Promise<void>;
}

const existingSubmittingData = (val: CriteriaFormData): val is Required<CriteriaFormData> => 'title' in val;

export const GoalCriteria: React.FC<GoalCriteriaProps> = ({
    list,
    canEdit,
    onGoalClick,
    onCreate,
    onUpdate,
    onRemove,
    onUpdateState,
    onConvertToGoal,
    validateGoalCriteriaBindings,
}) => {
    const [suggestions = [], setQuery] = useGoalSuggestions();
    const [addingCriteria, setAddingCriteria] = useState(false);

    const sortedCriteriaItems = useMemo(() => {
        const sorted = list.reduce<Record<'done' | 'undone', CriteriaItemValue[]>>(
            (acc, criteria) => {
                if (criteria.isDone) {
                    acc.done.push(criteria);
                } else {
                    acc.undone.push(criteria);
                }

                return acc;
            },
            {
                done: [],
                undone: [],
            },
        );

        return sorted.done.concat(sorted.undone);
    }, [list]);

    const criteriaList = useMemo(() => {
        if (addingCriteria) {
            return sortedCriteriaItems.concat({
                id: '',
                title: '',
                weight: 0,
                isDone: false,
            });
        }

        return sortedCriteriaItems;
    }, [sortedCriteriaItems, addingCriteria]);

    const shouldShowTitle = useMemo(() => {
        if (criteriaList.length) {
            if (criteriaList.length === 1 && criteriaList[0].id == null) {
                return false;
            }

            return true;
        }

        return false;
    }, [criteriaList]);

    const handleFormSubmit = useCallback(
        (hideForm: () => void) => (values: CriteriaFormData) => {
            if (existingSubmittingData(values)) {
                if (addingCriteria) {
                    onCreate(values);
                } else {
                    onUpdate(values);
                }
            }

            hideForm();
        },
        [onCreate, onUpdate, addingCriteria],
    );

    const dataForValidate = useMemo(() => {
        return sortedCriteriaItems.reduce<CriteriaValidityData>(
            (acc, criteria) => {
                acc.title.push(criteria.title);
                acc.sumOfCriteria += criteria.weight;
                return acc;
            },
            {
                title: [],
                sumOfCriteria: 0,
            },
        );
    }, [sortedCriteriaItems]);

    return (
        <ActivityFeedItem>
            <Circle size={32}>
                <IconMessageTickOutline size="s" color={backgroundColor} />
            </Circle>
            <StyledWrapper>
                {nullable(shouldShowTitle, () => (
                    <StyledTextHeading size="s" weight="bold" color={gray9}>
                        {tr('Achievement criteria')}
                    </StyledTextHeading>
                ))}
                <Table gap={5}>
                    {criteriaList.map((criteria) => (
                        <CriteriaItem
                            key={criteria.id}
                            criteria={criteria}
                            onRemove={onRemove}
                            onConvertGoal={onConvertToGoal}
                            onUpdateState={onUpdateState}
                            onCancel={() => setAddingCriteria(false)}
                            onClick={onGoalClick}
                            canEdit={canEdit}
                            renderForm={(props) => (
                                <Box>
                                    <CriteriaForm
                                        withModeSwitch
                                        defaultMode={criteria.criteriaGoal != null ? 'goal' : 'simple'}
                                        values={
                                            !addingCriteria
                                                ? {
                                                      mode: criteria.criteriaGoal != null ? 'goal' : 'simple',
                                                      title: criteria.title,
                                                      selected: criteria.criteriaGoal,
                                                      weight: criteria.weight != null ? String(criteria.weight) : '',
                                                  }
                                                : undefined
                                        }
                                        validityData={{
                                            ...dataForValidate,
                                            sumOfCriteria: dataForValidate.sumOfCriteria - criteria.weight,
                                        }}
                                        items={suggestions?.map((goal) => ({
                                            id: goal.id,
                                            title: goal.title,
                                            stateColor: goal.state?.hue,
                                        }))}
                                        onSubmit={handleFormSubmit(props.onEditCancel)}
                                        onInputChange={(val = '') => setQuery(val)}
                                        onCancel={props.onEditCancel}
                                        renderItem={(props) => (
                                            <MenuItem
                                                ghost
                                                focused={props.active || props.hovered}
                                                onClick={props.onItemClick}
                                                onMouseMove={props.onMouseMove}
                                                onMouseLeave={props.onMouseLeave}
                                            >
                                                <GoalBadge
                                                    title={props.item.title}
                                                    color={props.item.stateColor}
                                                    theme={1}
                                                />
                                            </MenuItem>
                                        )}
                                        validateBindingsFor={validateGoalCriteriaBindings}
                                    />
                                </Box>
                            )}
                        />
                    ))}
                    {nullable(canEdit, () => (
                        <InlineTrigger
                            icon={<IconPlusCircleOutline size="s" />}
                            text="Add achievement criteria"
                            onClick={() => setAddingCriteria(true)}
                        />
                    ))}
                </Table>
            </StyledWrapper>
        </ActivityFeedItem>
    );
};
