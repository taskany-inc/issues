import React, { useCallback, useMemo, memo } from 'react';
import styled, { css } from 'styled-components';
import { Text, CircleIcon, TickCircleIcon, MessageTickIcon, GoalIcon, nullable, CleanButton } from '@taskany/bricks';
import { State } from '@prisma/client';
import { backgroundColor, brandColor, gray10, gray6, gray7, gray9, gray8, textColor } from '@taskany/colors';
import NextLink from 'next/link';

import { AddCriteriaScheme, RemoveCriteriaScheme, UpdateCriteriaScheme } from '../../schema/criteria';
import { TitleItem, TitleContainer, Title, ContentItem, TextItem, Table } from '../Table';
import { StateDot } from '../StateDot';
import { ActivityFeed, ActivityFeedItem } from '../ActivityFeed';
import { ActivityByIdReturnType, GoalEstimate, GoalAchiveCriteria } from '../../../trpc/inferredTypes';
import { estimateToString } from '../../utils/estimateToString';
import { UserGroup } from '../UserGroup';
import { routes } from '../../hooks/router';
import { Circle } from '../Circle';

import { tr } from './GoalCriteria.i18n';

const StyledActivityFeed = styled(ActivityFeed)`
    padding: 0;
    z-index: 1;
`;

const StyledActivityFeedItem = styled(ActivityFeedItem)`
    padding-top: 20px;

    &:first-child::before {
        content: none;
    }

    &:last-child::after {
        content: '';
    }
`;

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledIcon = styled(MessageTickIcon)`
    display: flex;
    background-color: ${gray7};
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    text-align: center;

    width: 32px;
    height: 32px;
`;

const StyledCircleIcon = styled(CircleIcon)`
    color: ${gray8};

    &:hover {
        color: ${gray10};
    }
`;

const StyledTickIcon = styled(TickCircleIcon)`
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

const StyledCleanButton = styled(CleanButton)`
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    margin-right: 4px;
`;

const StyledTable = styled(Table)`
    width: 100%;
    grid-template-columns: 15px minmax(250px, 20%) repeat(5, max-content) 1fr;
    column-gap: 10px;
    row-gap: 2px;
    padding: 0;
    margin: 0 0 10px;
`;

const StyledActionContentItem = styled(ContentItem)`
    position: relative;
    justify-content: flex-end;
`;

const StyledTableRow = styled.div`
    position: relative;
    display: contents;
    & > *,
    & > *:first-child,
    & > *:last-child {
        padding: 0;
    }

    & ${StyledCleanButton} {
        position: relative;
        top: unset;
        right: unset;
    }

    &:hover {
        background-color: ${gray8};
    }

    &:hover ${StyledCleanButton} {
        visibility: visible;
        opacity: 1;
    }
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
            <ContentItem>
                <GoalCriteriaCheckBox onClick={onClick} checked={checked} canEdit={canEdit} />
            </ContentItem>
            <TitleItem>
                <TitleContainer>
                    <Title color={gray10} weight="thin">
                        {title}
                    </Title>
                </TitleContainer>
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
            <ContentItem>
                <GoalIcon size="s" />
            </ContentItem>

            <TitleItem as="a">
                <TitleContainer>
                    <NextLink passHref href={routes.goal(`${projectId}-${scopeId}`)}>
                        <StyledGoalAnchor color={textColor} weight="bold" as={Title}>
                            {title}
                        </StyledGoalAnchor>
                    </NextLink>
                </TitleContainer>
            </TitleItem>
        </>
    );
};

const criteriaGuard = (props: GoalCriteriaItemProps): props is CriteriaAsGoalProps => {
    return 'projectId' in props && props.projectId != null;
};

const GoalCriteriaItem: React.FC<GoalCriteriaItemProps> = memo((props) => {
    const { onCheck, canEdit, onRemove, title, isDone, weight, issuer, owner, projectId, state, estimate } = props;
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

    return (
        <StyledTableRow>
            {criteriaGuard(props) ? (
                <CriteriaGoalTitle projectId={props.projectId!} scopeId={props.scopeId!} title={title} />
            ) : (
                <CriteriaTitle title={title} checked={props.isDone} onClick={onToggle} canEdit={canEdit} />
            )}
            <ContentItem>
                <Text weight="bold" size="s" color={gray9}>
                    {weight}
                </Text>
            </ContentItem>
            <ContentItem>
                {nullable(state, (s) => (
                    <StateDot size="m" title={s?.title} hue={s?.hue} />
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
            <StyledActionContentItem align="right">
                {canEdit ? (
                    <>
                        {/* TODO: implements edit criteria */}
                        {/* <StyledActionButton iconLeft={<EditIcon size="s" />} /> */}
                        <StyledCleanButton onClick={onRemove} />
                    </>
                ) : null}
            </StyledActionContentItem>
        </StyledTableRow>
    );
});

interface GoalCriteriaProps {
    goalId?: string;
    criteriaList?: GoalAchiveCriteria[];
    canEdit: boolean;
    onAddCriteria: (val: AddCriteriaScheme) => void;
    onToggleCriteria: (val: UpdateCriteriaScheme) => void;
    onRemoveCriteria: (val: RemoveCriteriaScheme) => void;
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

    return (
        <StyledActivityFeed>
            <StyledActivityFeedItem>
                <Circle size={32}>
                    <StyledIcon size="s" color={backgroundColor} />
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
                                {criteriaList.map((item) => (
                                    <GoalCriteriaItem
                                        key={item.id}
                                        title={item.title}
                                        weight={item.weight}
                                        isDone={item.isDone}
                                        projectId={item.goalAsCriteria?.projectId}
                                        scopeId={item.goalAsCriteria?.scopeId}
                                        estimate={
                                            item.goalAsCriteria?.estimate[
                                                (item.goalAsCriteria?.estimate.length ?? 0) - 1
                                            ]?.estimate
                                        }
                                        owner={item.goalAsCriteria?.owner}
                                        issuer={item.goalAsCriteria?.activity}
                                        state={item.goalAsCriteria?.state}
                                        onCheck={(state) => onToggleCriteria({ ...item, isDone: state })}
                                        onRemove={() => onRemoveCriteria({ id: item.id })}
                                        canEdit={canEdit}
                                    />
                                ))}
                            </StyledTable>
                        </>
                    ))}
                    {renderForm({ onAddCriteria: onAddHandler, dataForValidateCriteria })}
                </StyledWrapper>
            </StyledActivityFeedItem>
        </StyledActivityFeed>
    );
};
