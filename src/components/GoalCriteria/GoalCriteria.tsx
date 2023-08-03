import React, { useCallback, useMemo, useState } from 'react';
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
import { Estimate, Goal, State } from '@prisma/client';
import { backgroundColor, brandColor, gray10, danger0, gray8, gray9, gray4, textColor } from '@taskany/colors';
import NextLink from 'next/link';

import {
    AddCriteriaScheme,
    RemoveCriteriaScheme,
    UpdateCriteriaScheme,
    UpdateCriteriaStateScheme,
} from '../../schema/criteria';
import { Title } from '../Table';
import { GoalAchiveCriteria } from '../../../trpc/inferredTypes';
import { ActivityFeedItem } from '../ActivityFeed';
import { Circle, CircledIcon } from '../Circle';
import { UserGroup } from '../UserGroup';
import { GoalListItemCompactCustomize, CustomCell } from '../GoalListItemCompact';
import { routes } from '../../hooks/router';
import { AddCriteriaForm, EditCriteriaForm } from '../CriteriaForm/CriteriaForm';

import { tr } from './GoalCriteria.i18n';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
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

const StyledTable = styled(Table)`
    width: 100%;
    margin-bottom: 10px;
`;

const StyledGoalTitle = styled(Title)`
    text-decoration: none;
    color: ${textColor};

    &:visited {
        color: ${textColor};
    }
`;

const StyledCheckboxWrapper = styled.span<{ canEdit: boolean }>`
    display: inline-flex;
    ${({ canEdit }) =>
        !canEdit &&
        css`
            pointer-events: none;
        `}

    ${({ canEdit }) =>
        canEdit &&
        css`
            cursor: pointer;
        `}
`;

const StyledTableRow = styled(GoalListItemCompactCustomize)`
    padding: 3px 0 4px;
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

const StyledHeadingWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 35px;
`;

const StyledTextHeading = styled(Text)`
    border-bottom: 1px solid ${gray4};
    display: grid;
    grid-template-columns: minmax(375px, 40%) max-content;
    width: 100%;
    max-width: calc(40% + 15px + 10px);
`;

interface GoalCriteriaItemProps {
    onRemove: () => void;
    onCheck?: (val: boolean) => void;
    onConvertToGoal?: () => void;
    onClick?: () => void;
    onUpdateClick: () => void;
    item: GoalAchiveCriteria & { goalAsCriteria?: (Goal & { state?: State | null }) | null };
    canEdit: boolean;
    goalId: string;
}

interface CriteriaAsGoalProps extends GoalCriteriaItemProps {
    item: GoalAchiveCriteria & { goalAsCriteria: (Goal & { state: State | null; estimate: Estimate | null }) | null };
}

function criteriaGuard(props: unknown): props is CriteriaAsGoalProps['item'] {
    if (typeof props === 'object' && props != null) {
        return (
            ('goalIdAsCriteria' in props && props.goalIdAsCriteria != null) ||
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
                icon: <IconEdit1Outline size="xxs" noWrap />,
                handler: onUpdateClick,
            },
        ];

        if (!goalAsCriteria && onConvertToGoal) {
            actions.push({
                label: tr('Create as goal'),
                icon: <IconTargetOutline size="xxs" noWrap />,
                handler: onConvertToGoal,
            });
        }

        actions.push({
            label: tr('Delete'),
            icon: <IconBinOutline size="xxs" noWrap />,
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
    const itemToRender = useMemo(() => {
        if (item.goalAsCriteria) {
            return {
                ...item.goalAsCriteria,
                shortId: `${item.goalAsCriteria.projectId}-${item.goalAsCriteria.scopeId}`,
                estimate: item.goalAsCriteria?.estimate[(item.goalAsCriteria?.estimate.length ?? 0) - 1]?.estimate,
                weight: item.weight,
            };
        }

        return item;
    }, [item]);

    return (
        <StyledTableRow
            actions={availableActions}
            onActionClick={handleChange}
            item={itemToRender}
            rowIcon={
                !goalAsCriteria && <GoalCriteriaCheckBox onClick={onToggle} checked={item.isDone} canEdit={canEdit} />
            }
            columns={[
                {
                    name: 'title',
                    renderColumn(values) {
                        if (!criteriaGuard(values)) {
                            return (
                                <CustomCell col={7}>
                                    <Title size="s" weight="thin">
                                        {values.title}
                                    </Title>
                                </CustomCell>
                            );
                        }

                        return (
                            <CustomCell col={4}>
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
                        <CustomCell justify="end" width="3ch">
                            {nullable(weight, (w) => (
                                <Text size="s">{w}</Text>
                            ))}
                        </CustomCell>
                    ),
                },
                {
                    name: 'state',
                    columnProps: {
                        col: 1,
                        justify: 'end',
                    },
                },
                {
                    name: 'projectId',
                    columnProps: {
                        col: 2,
                    },
                },
                {
                    name: 'issuers',
                    renderColumn: ({ issuers }) => (
                        <CustomCell align="start" width={45}>
                            <UserGroup users={issuers} size={18} />
                        </CustomCell>
                    ),
                },
                {
                    name: 'estimate',
                    columnProps: {
                        width: '7ch',
                    },
                },
            ]}
        />
    );
};

interface GoalCriteriaProps {
    goalId: string;
    criteriaList?: GoalAchiveCriteria[];
    canEdit: boolean;
    onClick?: (itenm: GoalAchiveCriteria) => void;
    onAddCriteria: (val: AddCriteriaScheme) => void;
    onToggleCriteria: (val: UpdateCriteriaStateScheme) => void;
    onRemoveCriteria: (val: RemoveCriteriaScheme) => void;
    onConvertToGoal: (val: GoalAchiveCriteria) => void;
    onUpdateCriteria: (val: UpdateCriteriaScheme) => void;
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
}) => {
    const [{ mode, index }, setViewItemMode] = useState<{ mode: 'view'; index: -1 } | { mode: 'edit'; index: number }>({
        mode: 'view',
        index: -1,
    });
    const onAddHandler = useCallback(
        (val: AddCriteriaScheme) => {
            if (goalId) {
                onAddCriteria({ ...val, goalId });
            }
        },
        [onAddCriteria, goalId],
    );

    const dataForValidateCriteria = useMemo(
        () =>
            criteriaList.reduce<{ sum: number; title: string[] }>(
                (acc, { weight, title }, criteriaIdx) => {
                    if (mode === 'edit' && index === criteriaIdx) {
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
        [criteriaList, mode, index],
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

    return (
        <ActivityFeedItem>
            <Circle size={32}>
                <CircledIcon as={IconMessageTickOutline} size="s" color={backgroundColor} />
            </Circle>
            <StyledWrapper>
                {nullable(criteriaList.length, () => (
                    <StyledHeadingWrapper>
                        <StyledTextHeading size="s" weight="bold" color={gray9}>
                            {tr('Achievement criteria')}
                        </StyledTextHeading>
                    </StyledHeadingWrapper>
                ))}
                <StyledTable gap={5}>
                    {sortedCriteriaItems.map((item, i) => {
                        if (mode === 'view' || i !== index) {
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
                                            index: i,
                                        })
                                    }
                                    canEdit={canEdit}
                                    item={item}
                                />
                            );
                        }
                        if (mode === 'edit' && index === i) {
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
                                            index: -1,
                                        })
                                    }
                                />
                            );
                        }

                        return null;
                    })}
                    <AddCriteriaForm goalId={goalId} onSubmit={onAddHandler} validityData={dataForValidateCriteria} />
                </StyledTable>
            </StyledWrapper>
        </ActivityFeedItem>
    );
};
