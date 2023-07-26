import React, { useCallback, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import {
    IconTargetOutline,
    IconCircleOutline,
    IconMessageTickOutline,
    IconTickCircleOutline,
    IconBinOutline,
} from '@taskany/icons';
import { State } from '@prisma/client';
import { backgroundColor, brandColor, gray10, danger0, gray8, gray9, gray4 } from '@taskany/colors';
import NextLink from 'next/link';

import { AddCriteriaScheme, RemoveCriteriaScheme, UpdateCriteriaScheme } from '../../schema/criteria';
import { Title, ContentItem, Table } from '../Table';
import { ActivityByIdReturnType, GoalEstimate, GoalAchiveCriteria } from '../../../trpc/inferredTypes';
import { ActivityFeedItem } from '../ActivityFeed';
import { Circle, CircledIcon } from '../Circle';
import { UserGroup } from '../UserGroup';
import { GoalListItemCompactCustomize, CustomCell } from '../GoalListItemCompact';
import { routes } from '../../hooks/router';

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
    grid-template-columns: 15px minmax(40%, 350px) max-content repeat(5, max-content);
    column-gap: 10px;
    row-gap: 5px;
    padding: 0;
    margin: 0;
    margin-bottom: 10px;
`;

const StyledTableRow = styled(GoalListItemCompactCustomize)`
    display: contents;
    position: relative;

    &:hover {
        & ${ContentItem} {
            background-color: unset;
        }
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

interface CommonCriteriaProps {
    isDone: boolean;
    title: string;
    weight: number;
    canEdit: boolean;
    onRemove: () => void;
    onCheck?: (val: boolean) => void;
    projectId?: string | null;
    scopeId?: number | null;
    issuer?: ActivityByIdReturnType | null;
    owner?: ActivityByIdReturnType | null;
    estimate?: GoalEstimate | null;
    state?: State | null;
}

interface CriteriaAsGoalProps extends CommonCriteriaProps {
    projectId: string | null;
    scopeId: number | null;
    issuer: ActivityByIdReturnType | null;
    owner: ActivityByIdReturnType | null;
    estimate: GoalEstimate | null;
    state: State | null;
}

interface GoalCriteriaItemProps {
    isDone: boolean;
    title: string;
    weight: number;
    canEdit: boolean;
    onRemove: () => void;
    onCheck?: (val: boolean) => void;
    projectId?: string | null;
    scopeId?: number | null;
    issuer?: ActivityByIdReturnType | null;
    owner?: ActivityByIdReturnType | null;
    estimate?: GoalEstimate | null;
    state?: State | null;
    onConvertToGoal?: () => void;
    onClick?: () => void;
}

const criteriaGuard = (props: GoalCriteriaItemProps): props is CriteriaAsGoalProps => {
    return 'projectId' in props && props.projectId != null;
};

type CriteriaActionItem = {
    label: string;
    handler: () => void;
    color?: string;
    icon: React.ReactNode;
};

const GoalCriteriaItem: React.FC<GoalCriteriaItemProps> = (props) => {
    const {
        onCheck,
        canEdit,
        onRemove,
        onConvertToGoal,
        onClick,
        title,
        isDone,
        weight,
        issuer,
        owner,
        projectId,
        scopeId,
        state,
        estimate,
    } = props;
    const onToggle = useCallback(() => {
        onCheck?.(!isDone);
    }, [onCheck, isDone]);

    const goalAsCriteria = criteriaGuard(props);

    const availableActions = useMemo<CriteriaActionItem[] | undefined>(() => {
        if (!canEdit) {
            return;
        }

        const actions: CriteriaActionItem[] = [];

        if (!criteriaGuard(props) && onConvertToGoal) {
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
    }, [canEdit, onRemove, props, onConvertToGoal]);

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

    return (
        <StyledTableRow
            actions={availableActions}
            onActionClick={handleChange}
            item={{
                title,
                weight,
                issuer,
                owner,
                projectId,
                scopeId,
                state,
                estimate,
            }}
            rowIcon={!goalAsCriteria && <GoalCriteriaCheckBox onClick={onToggle} checked={isDone} canEdit={canEdit} />}
            columns={[
                {
                    name: 'title',
                    renderColumn(values) {
                        if (!goalAsCriteria) {
                            return (
                                <CustomCell>
                                    <Title size="s" weight="thin">
                                        {values.title}
                                    </Title>
                                </CustomCell>
                            );
                        }

                        return (
                            <CustomCell>
                                <NextLink
                                    passHref
                                    href={routes.goal(`${values.projectId}-${values.scopeId}`)}
                                    legacyBehavior
                                >
                                    <Title size="s" weight="bold" onClick={onTitleClickHandler}>
                                        {values.title}
                                    </Title>
                                </NextLink>
                            </CustomCell>
                        );
                    },
                },
                {
                    name: 'weight',
                    renderColumn: ({ weight }) => (
                        <CustomCell align="right">
                            {nullable(weight, (w) => (
                                <Text size="s">{w}</Text>
                            ))}
                        </CustomCell>
                    ),
                },
                { name: 'state' },
                { name: 'projectId' },
                {
                    name: 'issuers',
                    renderColumn: ({ issuers }) => (
                        <CustomCell>
                            <UserGroup users={issuers} size={18} />
                        </CustomCell>
                    ),
                },
                { name: 'estimate' },
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
    onToggleCriteria: (val: UpdateCriteriaScheme) => void;
    onRemoveCriteria: (val: RemoveCriteriaScheme) => void;
    onConvertToGoal: (val: GoalAchiveCriteria) => void;
    renderForm: (props: {
        onAddCriteria: GoalCriteriaProps['onAddCriteria'];
        dataForValidateCriteria: {
            sum: number;
            title: string[];
        };
    }) => React.ReactNode;
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
    renderForm,
}) => {
    const onAddHandler = useCallback(
        (val: AddCriteriaScheme) => {
            if (goalId) {
                onAddCriteria({ ...val, goalId });
            }
        },
        [onAddCriteria, goalId],
    );

    const dataForValidateCriteria = useMemo(() => {
        return criteriaList.reduce(
            (acc, { weight, title }) => {
                acc.sum += weight;
                acc.title.push(title);
                return acc;
            },
            {
                sum: 0,
                title: [] as string[],
            },
        );
    }, [criteriaList]);

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
                    <>
                        <StyledHeadingWrapper>
                            <StyledTextHeading size="s" weight="bold" color={gray9}>
                                {tr('Achievement criteria')}
                            </StyledTextHeading>
                        </StyledHeadingWrapper>
                        <StyledTable columns={8}>
                            {sortedCriteriaItems.map((item) => (
                                <GoalCriteriaItem
                                    key={item.id}
                                    title={item.title}
                                    weight={item.weight}
                                    isDone={item.isDone}
                                    projectId={item.goalAsCriteria?.projectId}
                                    scopeId={item.goalAsCriteria?.scopeId}
                                    estimate={
                                        item.goalAsCriteria?.estimate[(item.goalAsCriteria?.estimate.length ?? 0) - 1]
                                            ?.estimate
                                    }
                                    owner={item.goalAsCriteria?.owner}
                                    issuer={item.goalAsCriteria?.activity}
                                    state={item.goalAsCriteria?.state}
                                    onCheck={(state) => onToggleCriteria({ ...item, isDone: state })}
                                    onClick={onClick ? () => onClick(item) : undefined}
                                    onRemove={() => onRemoveCriteria({ id: item.id, goalId })}
                                    onConvertToGoal={() => onConvertToGoal(item)}
                                    canEdit={canEdit}
                                />
                            ))}
                        </StyledTable>
                    </>
                ))}
                {renderForm({ onAddCriteria: onAddHandler, dataForValidateCriteria })}
            </StyledWrapper>
        </ActivityFeedItem>
    );
};
