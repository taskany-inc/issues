import React, { ComponentProps, useCallback, useMemo, useState } from 'react';
import cn from 'classnames';
import { Text, nullable, MenuItem, Dropdown } from '@taskany/bricks';
import {
    IconTargetOutline,
    IconCircleOutline,
    IconMessageTickOutline,
    IconTickCircleOutline,
    IconBinOutline,
    IconEdit1Outline,
    IconMoreVerticalOutline,
} from '@taskany/icons';
import { Table, TableRow } from '@taskany/bricks/harmony';
import { backgroundColor, danger0, gray9 } from '@taskany/colors';

import { ActivityFeedItem } from '../ActivityFeed';
import { Circle } from '../Circle';
import { GoalBadge } from '../GoalBadge';
import { Badge } from '../Badge';
import { IssueMeta } from '../IssueMeta';
import { AddInlineTrigger } from '../AddInlineTrigger';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger';
import { GoalCriteriaSuggest } from '../GoalCriteriaSuggest';
import { routes } from '../../hooks/router';
import { CustomCell } from '../GoalListItemCompact/GoalListItemCompact';

import { tr } from './GoalCriteria.i18n';
import s from './GoalCriteria.module.css';

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
    const Icon = !checked ? IconCircleOutline : IconTickCircleOutline;

    return (
        <span
            className={cn(s.GoalCriteriaCheckBox, {
                [s.GoalCriteriaCheckBox_disabled]: !canEdit,
                [s.GoalCriteriaCheckBox_checked]: checked,
            })}
            onClick={onClick}
        >
            <Icon size="s" />
        </span>
    );
};

interface CriteriaItemValue {
    id: string;
    title: string;
    weight: number;
    isDone: boolean;
    criteriaGoal: {
        id: string;
        title: string;
        _shortId: string;
        state?: {
            hue: number;
        } | null;
    } | null;
}

interface CriteriaItemProps {
    goalId: string;
    criteria: CriteriaItemValue;
    canEdit: boolean;
    onClick?: (goal: { _shortId: string }) => void;
    onUpdateState: (value: CriteriaItemValue) => void;
    onRemove: (value: CriteriaItemValue) => void;
    onConvertGoal: (value: CriteriaItemValue) => void;
    onUpdate: ComponentProps<typeof GoalCriteriaSuggest>['onSubmit'];
    validateGoalCriteriaBindings: ComponentProps<typeof GoalCriteriaSuggest>['validateGoalCriteriaBindings'];
}

const CriteriaItem: React.FC<CriteriaItemProps> = ({
    goalId,
    criteria,
    canEdit,
    onUpdateState,
    onConvertGoal,
    onRemove,
    onClick,
    onUpdate,
    validateGoalCriteriaBindings,
}) => {
    const [mode, setMode] = useState<'view' | 'edit'>('view');

    const availableActions = useMemo<CriteriaActionItem[] | undefined>(() => {
        if (!canEdit) {
            return;
        }

        const actions: CriteriaActionItem[] = [
            {
                label: tr('Edit'),
                icon: <IconEdit1Outline size="xxs" />,
                handler: () => setMode('edit'),
            },
        ];

        if (!criteria.criteriaGoal && onConvertGoal) {
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
    }, [canEdit, criteria, onConvertGoal, onRemove]);

    const handleChange = useCallback((val: CriteriaActionItem) => {
        val.handler();
    }, []);

    const [defaultMode, values]: ['goal' | 'simple', ComponentProps<typeof GoalCriteriaSuggest>['values']] =
        useMemo(() => {
            const mode = criteria.criteriaGoal ? 'goal' : 'simple';
            return [
                mode,
                {
                    id: criteria.id,
                    mode,
                    title: criteria.title,
                    weight: criteria.weight ? `${criteria.weight}` : '',
                    selected: {
                        id: criteria.criteriaGoal?.id || '',
                        title: criteria.criteriaGoal?.title || '',
                        stateColor: criteria.criteriaGoal?.state?.hue,
                    },
                },
            ];
        }, [criteria]);

    return (
        <>
            <TableRow key={criteria.id}>
                <CustomCell className={s.GoalCriteriaItemTitle}>
                    {nullable(
                        criteria.criteriaGoal,
                        (goal) => (
                            <GoalBadge
                                title={goal.title}
                                color={goal.state?.hue}
                                href={routes.goal(goal._shortId)}
                                onClick={() => onClick?.(goal)}
                            />
                        ),
                        <Badge
                            icon={
                                <GoalCriteriaCheckBox
                                    checked={criteria.isDone}
                                    canEdit={canEdit}
                                    onClick={() => onUpdateState({ ...criteria, isDone: !criteria.isDone })}
                                />
                            }
                            text={criteria.title}
                        />,
                    )}
                </CustomCell>
                <CustomCell width={40} justify="end">
                    {nullable(criteria.weight > 0, () => (
                        <Text size="s" color={gray9}>
                            {criteria.weight}
                        </Text>
                    ))}
                </CustomCell>
                <CustomCell width={40} justify="end" forIcon>
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
                </CustomCell>
            </TableRow>

            {nullable(mode === 'edit', () => (
                <GoalFormPopupTrigger
                    defaultVisible
                    renderTrigger={({ ref }) => <div ref={ref} />}
                    onCancel={() => setMode('view')}
                >
                    <GoalCriteriaSuggest
                        id={goalId}
                        defaultMode={defaultMode}
                        values={values}
                        onSubmit={onUpdate}
                        validateGoalCriteriaBindings={validateGoalCriteriaBindings}
                        editMode
                    />
                </GoalFormPopupTrigger>
            ))}
        </>
    );
};

interface GoalCriteriaProps {
    goalId: string;
    list: CriteriaItemValue[];
    canEdit: boolean;
    onRemove: (values: CriteriaItemValue) => Promise<void>;
    onConvertToGoal: (values: CriteriaItemValue) => Promise<void>;
    onUpdateState: (values: CriteriaItemValue) => Promise<void>;
    onClick?: (values: CriteriaItemValue) => void;
    onUpdate: CriteriaItemProps['onUpdate'];
    onCreate: CriteriaItemProps['onUpdate'];
    onGoalClick?: CriteriaItemProps['onClick'];
    validateGoalCriteriaBindings: CriteriaItemProps['validateGoalCriteriaBindings'];
}

export const GoalCriteria: React.FC<GoalCriteriaProps> = ({
    goalId,
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

    return (
        <ActivityFeedItem>
            <Circle size={32}>
                <IconMessageTickOutline size="s" color={backgroundColor} />
            </Circle>
            <IssueMeta className={s.GoalCriteriaIssueMeta} title={tr('Achievement criteria')}>
                <Table>
                    {sortedCriteriaItems.map((criteria) => (
                        <CriteriaItem
                            goalId={goalId}
                            canEdit={canEdit}
                            key={criteria.id}
                            criteria={criteria}
                            onClick={onGoalClick}
                            onUpdateState={onUpdateState}
                            onUpdate={onUpdate}
                            onConvertGoal={onConvertToGoal}
                            onRemove={onRemove}
                            validateGoalCriteriaBindings={validateGoalCriteriaBindings}
                        />
                    ))}
                </Table>

                {nullable(canEdit, () => (
                    <GoalFormPopupTrigger
                        renderTrigger={(props) => (
                            <AddInlineTrigger
                                text={tr('Add achievement criteria')}
                                ref={props.ref}
                                onClick={props.onClick}
                                centered={false}
                            />
                        )}
                    >
                        <GoalCriteriaSuggest
                            id={goalId}
                            withModeSwitch
                            defaultMode="simple"
                            items={list.map((criteria) => ({ ...criteria, goal: criteria.criteriaGoal }))}
                            onSubmit={onCreate}
                            validateGoalCriteriaBindings={validateGoalCriteriaBindings}
                        />
                    </GoalFormPopupTrigger>
                ))}
            </IssueMeta>
        </ActivityFeedItem>
    );
};
