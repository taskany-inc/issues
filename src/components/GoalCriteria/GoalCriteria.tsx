import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { Text, nullable, Table } from '@taskany/bricks';
import {
    IconTargetOutline,
    IconCircleOutline,
    IconMessageTickOutline,
    IconTickCircleOutline,
    IconBinOutline,
    IconEdit1Outline,
} from '@taskany/icons';
import { backgroundColor, brandColor, gray10, danger0, gray8, gray9, gray4, gapS } from '@taskany/colors';
import NextLink from 'next/link';

import {
    AddCriteriaSchema,
    RemoveCriteriaSchema,
    UpdateCriteriaSchema,
    UpdateCriteriaStateSchema,
} from '../../schema/criteria';
import { Title } from '../Table';
import { GoalAchiveCriteria } from '../../../trpc/inferredTypes';
import { ActivityFeedItem } from '../ActivityFeed';
import { Circle } from '../Circle';
import { GoalListItemCompact, CustomCell } from '../GoalListItemCompact';
import { routes } from '../../hooks/router';
import { EditCriteriaForm } from '../CriteriaForm/CriteriaForm';
import { StateDot } from '../StateDot';

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

const StyledGoalTitle = styled(Title)`
    text-decoration: none;
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

interface GoalCriteriaItemProps {
    onRemove: () => void;
    onCheck?: (val: boolean) => void;
    onConvertToGoal?: () => void;
    onClick?: () => void;
    onUpdateClick: () => void;
    item: GoalAchiveCriteria;
    canEdit: boolean;
    goalId: string;
}

interface CriteriaAsGoalProps extends GoalCriteriaItemProps {
    item: GoalAchiveCriteria;
}

function criteriaGuard(props: unknown): props is CriteriaAsGoalProps['item'] {
    if (typeof props === 'object' && props != null) {
        return (
            ('criteriaGoalId' in props && props.criteriaGoalId != null) ||
            ('projectId' in props && props.projectId != null)
        );
    }

    return false;
}

type CriteriaActionItem = {
    label: string;
    handler: () => void;
    color?: string;
    icon: React.ReactNode;
};

const GoalCriteriaItem: React.FC<GoalCriteriaItemProps> = (props) => {
    const { onCheck, canEdit, onRemove, onConvertToGoal, onUpdateClick, onClick, item } = props;
    const onToggle = useCallback(() => {
        onCheck?.(!item.isDone);
    }, [onCheck, item.isDone]);

    const goalAsCriteria = criteriaGuard(props.item);

    const availableActions = useMemo<CriteriaActionItem[] | undefined>(() => {
        if (!canEdit) {
            return;
        }

        const actions: CriteriaActionItem[] = [
            {
                label: 'Edit',
                icon: <IconEdit1Outline size="xxs" />,
                handler: onUpdateClick,
            },
        ];

        if (!goalAsCriteria && onConvertToGoal) {
            actions.push({
                label: tr('Create as goal'),
                icon: <IconTargetOutline size="xxs" />,
                handler: onConvertToGoal,
            });
        }

        actions.push({
            label: tr('Delete'),
            icon: <IconBinOutline size="xxs" />,
            color: danger0,
            handler: onRemove,
        });

        return actions;
    }, [canEdit, onRemove, goalAsCriteria, onConvertToGoal, onUpdateClick]);

    const handleChange = useCallback((val: CriteriaActionItem) => {
        val.handler();
    }, []);

    const onTitleClickHandler = useCallback(
        (e: React.MouseEvent) => {
            if (onClick) {
                e.preventDefault();
                onClick();
            }
        },
        [onClick],
    );
    const itemToRender: Partial<GoalAchiveCriteria['criteriaGoal'] & { shortId: string; weight: number }> =
        useMemo(() => {
            if (item.criteriaGoal) {
                return {
                    ...item.criteriaGoal,
                    shortId: `${item.criteriaGoal.projectId}-${item.criteriaGoal.scopeId}`,
                    weight: item.weight,
                };
            }

            return item;
        }, [item]);

    return (
        <GoalListItemCompact
            icon
            actions={availableActions}
            onActionClick={handleChange}
            item={itemToRender}
            align="start"
            rawIcon={
                goalAsCriteria ? (
                    <StateDot size="m" title={itemToRender?.title} hue={itemToRender?.state?.hue} />
                ) : (
                    <GoalCriteriaCheckBox onClick={onToggle} checked={item.isDone} canEdit={canEdit} />
                )
            }
            columns={[
                {
                    name: 'title',
                    renderColumn(values) {
                        if (!criteriaGuard(values)) {
                            return (
                                <CustomCell width="75%">
                                    <Title size="s" weight="thin">
                                        {values.title}
                                    </Title>
                                </CustomCell>
                            );
                        }
                        return (
                            <CustomCell width="75%">
                                <NextLink passHref href={routes.goal(values.shortId)} legacyBehavior>
                                    <StyledGoalTitle size="s" weight="bold" onClick={onTitleClickHandler} as="a">
                                        {values.title}
                                    </StyledGoalTitle>
                                </NextLink>
                            </CustomCell>
                        );
                    },
                },
                {
                    name: 'weight',
                    renderColumn: ({ weight }) => (
                        <CustomCell justify="end">
                            {nullable(weight, (w) => (
                                <Text size="s">{w}</Text>
                            ))}
                        </CustomCell>
                    ),
                },
            ]}
        />
    );
};

interface GoalCriteriaProps {
    goalId: string;
    criteriaList?: GoalAchiveCriteria[];
    canEdit: boolean;
    onClick?: (item: GoalAchiveCriteria) => void;
    onAddCriteria: (val: AddCriteriaSchema) => void;
    onToggleCriteria: (val: UpdateCriteriaStateSchema) => void;
    onRemoveCriteria: (val: RemoveCriteriaSchema) => void;
    onConvertToGoal: (val: GoalAchiveCriteria) => void;
    onUpdateCriteria: (val: UpdateCriteriaSchema) => void;
    renderTrigger?: (obj: {
        goalId: string;
        onSubmit: (val: AddCriteriaSchema) => void;
        validityData: { sum: number; title: string[] };
    }) => ReactNode;
}

export const GoalCriteria: React.FC<GoalCriteriaProps> = ({
    goalId,
    criteriaList = [],
    canEdit,
    onClick,
    onAddCriteria,
    onToggleCriteria,
    onRemoveCriteria,
    onConvertToGoal,
    onUpdateCriteria,
    renderTrigger,
}) => {
    const [{ mode, criteriaId }, setViewItemMode] = useState<
        { mode: 'view'; criteriaId: null } | { mode: 'edit'; criteriaId: string }
    >({
        mode: 'view',
        criteriaId: null,
    });
    const onAddHandler = useCallback(
        (val: AddCriteriaSchema) => {
            if (goalId) {
                onAddCriteria({ ...val, goalId });
            }
        },
        [onAddCriteria, goalId],
    );

    const sortedCriteriaItems = useMemo(() => {
        const list = criteriaList.reduce<Record<'done' | 'undone', GoalAchiveCriteria[]>>(
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

        return list.done.concat(list.undone);
    }, [criteriaList]);

    const dataForValidateCriteria = useMemo(
        () =>
            sortedCriteriaItems.reduce<{ sum: number; title: string[] }>(
                (acc, { weight, title, id }) => {
                    if (mode === 'edit' && id === criteriaId) {
                        return acc;
                    }
                    acc.sum += weight;
                    acc.title.push(title);
                    return acc;
                },
                {
                    sum: 0,
                    title: [],
                },
            ),
        [sortedCriteriaItems, mode, criteriaId],
    );

    return (
        <ActivityFeedItem>
            <Circle size={32}>
                <IconMessageTickOutline size="s" color={backgroundColor} />
            </Circle>
            <StyledWrapper>
                {nullable(criteriaList.length, () => (
                    <StyledTextHeading size="s" weight="bold" color={gray9}>
                        {tr('Achievement criteria')}
                    </StyledTextHeading>
                ))}
                <Table gap={5}>
                    {sortedCriteriaItems.map((item) => {
                        if (mode === 'view' || item.id !== criteriaId) {
                            return (
                                <GoalCriteriaItem
                                    key={item.id}
                                    goalId={goalId}
                                    onCheck={(state) => onToggleCriteria({ ...item, isDone: state })}
                                    onRemove={() => onRemoveCriteria({ id: item.id, goalId })}
                                    onConvertToGoal={() => onConvertToGoal(item)}
                                    onClick={onClick ? () => onClick(item) : undefined}
                                    onUpdateClick={() =>
                                        setViewItemMode({
                                            mode: 'edit',
                                            criteriaId: item.id,
                                        })
                                    }
                                    canEdit={canEdit}
                                    item={item}
                                />
                            );
                        }
                        if (mode === 'edit' && criteriaId === item.id) {
                            return (
                                <EditCriteriaForm
                                    key={item.id}
                                    validityData={dataForValidateCriteria}
                                    goalId={goalId}
                                    values={{
                                        id: item.id,
                                        title: item.title,
                                        goalId,
                                        goalAsGriteria:
                                            item.goalIdAsCriteria != null ? { id: item.goalIdAsCriteria } : undefined,
                                        weight: item.weight ? String(item.weight) : '',
                                    }}
                                    onSubmit={onUpdateCriteria}
                                    onReset={() =>
                                        setViewItemMode({
                                            mode: 'view',
                                            criteriaId: null,
                                        })
                                    }
                                />
                            );
                        }

                        return null;
                    })}

                    {renderTrigger?.({ goalId, validityData: dataForValidateCriteria, onSubmit: onAddHandler })}
                </Table>
            </StyledWrapper>
        </ActivityFeedItem>
    );
};
