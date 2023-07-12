import React, { useCallback, useMemo, memo } from 'react';
import styled, { css } from 'styled-components';
import { Dropdown, MenuItem, Text, nullable } from '@taskany/bricks';
import {
    IconXCircleSolid,
    IconTargetOutline,
    IconCircleOutline,
    IconMessageTickOutline,
    IconTickCircleOutline,
    IconMoreVerticalOutline,
} from '@taskany/icons';
import { State } from '@prisma/client';
import { backgroundColor, brandColor, gray10, gray6, gray9, gray8, textColor, danger0 } from '@taskany/colors';
import NextLink from 'next/link';

import { AddCriteriaScheme, RemoveCriteriaScheme, UpdateCriteriaScheme } from '../../schema/criteria';
import { TitleItem, TitleContainer, Title, ContentItem, TextItem, Table } from '../Table';
import { StateDot } from '../StateDot';
import { ActivityFeedItem } from '../ActivityFeed';
import { ActivityByIdReturnType, GoalEstimate, GoalAchiveCriteria } from '../../../trpc/inferredTypes';
import { estimateToString } from '../../utils/estimateToString';
import { UserGroup } from '../UserGroup';
import { routes } from '../../hooks/router';
import { Circle, CircledIcon } from '../Circle';

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

const StyledActionWrapper = styled.span`
    display: inline-flex;
    align-items: baseline;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    align-self: baseline;
    gap: 0.25rem;
    visibility: hidden;
`;

const StyledContentCellWithOffset = styled(ContentItem)``;

const StyledTable = styled(Table)`
    width: 100%;
    grid-template-columns: 15px minmax(250px, 20%) repeat(5, max-content) 1fr;
    column-gap: 10px;
    row-gap: 2px;
    padding: 0;
    margin: 0 0 10px;

    & ${ContentItem}, & ${TitleItem} {
        align-items: baseline;
        padding: 0;
    }

    & ${ContentItem}:first-child {
        padding-top: 2px;
    }
`;

const StyledTableRow = styled.div`
    position: relative;
    display: contents;

    &:hover {
        background-color: ${gray8};
    }

    &:hover ${StyledActionWrapper} {
        visibility: visible;
        opacity: 1;
    }
`;

const StyledStateDot = styled(StateDot)`
    margin-top: 4px;
`;

const StyledTitleContainer = styled(TitleContainer)`
    flex: 0 1 auto;
    max-width: 90%;
`;

const StyledHeadingWrapper = styled.div`
    display: flex;
    align-items: center;
    height: 35px;
`;

const StyledGoalAnchor = styled.a`
    text-decoration: none;
    cursor: pointer;
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
}

interface CriteriaTitleProps {
    title: string;
    checked: boolean;
    canEdit: boolean;
    onClick: () => void;
}

const CriteriaTitle: React.FC<CriteriaTitleProps> = ({ title, checked, canEdit, onClick }) => {
    return (
        <>
            <StyledContentCellWithOffset>
                <GoalCriteriaCheckBox onClick={onClick} checked={checked} canEdit={canEdit} />
            </StyledContentCellWithOffset>
            <TitleItem>
                <StyledTitleContainer>
                    <Title color={gray10} weight="thin">
                        {title}
                    </Title>
                </StyledTitleContainer>
            </TitleItem>
        </>
    );
};

interface CriteriaGoalTitleProps {
    title: string;
    projectId: string | null;
    scopeId: number | null;
}

const CriteriaGoalTitle: React.FC<CriteriaGoalTitleProps> = ({ projectId, scopeId, title }) => {
    return (
        <>
            <StyledContentCellWithOffset>
                <IconTargetOutline size="s" />
            </StyledContentCellWithOffset>
            <TitleItem as="a">
                <StyledTitleContainer>
                    <NextLink passHref href={routes.goal(`${projectId}-${scopeId}`)}>
                        <StyledGoalAnchor color={textColor} weight="bold" as={Title}>
                            {title}
                        </StyledGoalAnchor>
                    </NextLink>
                </StyledTitleContainer>
            </TitleItem>
        </>
    );
};

const criteriaGuard = (props: GoalCriteriaItemProps): props is CriteriaAsGoalProps => {
    return 'projectId' in props && props.projectId != null;
};

type CriteriaActionItem = {
    label: string;
    handler: () => void;
    color?: string;
    icon: React.ReactNode;
};

const GoalCriteriaItem: React.FC<GoalCriteriaItemProps> = memo((props) => {
    const {
        onCheck,
        canEdit,
        onRemove,
        onConvertToGoal,
        title,
        isDone,
        weight,
        issuer,
        owner,
        projectId,
        state,
        estimate,
    } = props;
    const onToggle = useCallback(() => {
        onCheck?.(!isDone);
    }, [onCheck, isDone]);

    const issuers = useMemo(() => {
        if (criteriaGuard(props)) {
            if (issuer && owner && owner.id === issuer.id) {
                return [owner];
            }

            return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
        }

        return null;
    }, [issuer, owner, props]);

    const availableActions = useMemo<CriteriaActionItem[] | null>(() => {
        if (!canEdit) {
            return null;
        }

        const actions: CriteriaActionItem[] = [];

        if (!criteriaGuard(props) && onConvertToGoal) {
            actions.push({
                label: tr('Create as goal'),
                icon: <IconTargetOutline size="xxs" />,
                handler: onConvertToGoal,
            });
        }

        actions.push({
            label: tr('Delete'),
            icon: <IconXCircleSolid size="xxs" />,
            color: danger0,
            handler: onRemove,
        });

        return actions;
    }, [canEdit, onRemove, props, onConvertToGoal]);

    const handleChange = useCallback((val: CriteriaActionItem) => {
        val.handler();
    }, []);

    return (
        <StyledTableRow>
            {criteriaGuard(props) ? (
                <CriteriaGoalTitle projectId={props.projectId!} scopeId={props.scopeId!} title={title} />
            ) : (
                <CriteriaTitle title={title} checked={props.isDone} onClick={onToggle} canEdit={canEdit} />
            )}
            <ContentItem>
                {nullable(weight, () => (
                    <Text weight="bold" size="s" color={gray9}>
                        {weight}
                    </Text>
                ))}
            </ContentItem>
            <ContentItem>
                {nullable(state, (s) => (
                    <StyledStateDot size="m" title={s?.title} hue={s?.hue} />
                ))}
            </ContentItem>
            <ContentItem>
                {nullable(projectId, (p) => (
                    <TextItem>{p}</TextItem>
                ))}
            </ContentItem>
            <ContentItem align="center">
                {nullable(issuers, (list) => (
                    <UserGroup users={list} size={18} />
                ))}
            </ContentItem>
            <ContentItem>
                <TextItem>{nullable(estimate, (e) => estimateToString(e))}</TextItem>
            </ContentItem>
            <ContentItem>
                {nullable(availableActions, (actions) => (
                    <Dropdown
                        onChange={handleChange}
                        renderTrigger={({ onClick }) => <IconMoreVerticalOutline size="xs" onClick={onClick} />}
                        items={actions}
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
                ))}
            </ContentItem>
        </StyledTableRow>
    );
});

interface GoalCriteriaProps {
    goalId: string;
    criteriaList?: GoalAchiveCriteria[];
    canEdit: boolean;
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
                            <Text color={gray6} weight="bold">
                                {tr('Achivement criteria')}
                            </Text>
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
