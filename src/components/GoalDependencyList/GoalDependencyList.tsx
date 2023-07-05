import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { CleanButton, MessageTextAltIcon, Text, nullable } from '@taskany/bricks';
import { backgroundColor, gray6 } from '@taskany/colors';
import { Estimate, State } from '@prisma/client';
import NextLink from 'next/link';

import { ActivityFeedItem } from '../ActivityFeed';
import { ToggleGoalDependency, dependencyKind } from '../../schema/goal';
import { ActivityByIdReturnType, GoalDependencyItem } from '../../../trpc/inferredTypes';
import { Circle, CircledIcon as CircleIconInner } from '../Circle';
import { ContentItem, Table, Title, TitleContainer, TitleItem } from '../Table';
import { GoalListItemCompactCustomize } from '../GoalListItemCompact';
import { routes } from '../../hooks/router';
import { UserGroup } from '../UserGroup';

import { tr } from './GoalDependencyList.i18n';

const StyledWrapper = styled.div``;
const StyledHeadingWrapper = styled.div`
    height: 32px;
    display: flex;
    align-items: center;
`;
const StyledTable = styled(Table)`
    grid-template-columns: 15px minmax(350px, 20%) repeat(4, 1fr);
    padding: 0;
    margin: 0;

    & ${ContentItem} {
        padding: 2px 5px;
        box-sizing: border-box;
    }

    & ${ContentItem}, & ${TitleItem} {
        align-items: baseline;
    }

    & ${ContentItem}:first-child {
        padding: 0;
        padding-top: 2px;
    }
`;

const StyledTitleContainer = styled(TitleContainer)`
    flex: 0 1 auto;
    max-width: 80%;
`;

const StyledCleanButton = styled(CleanButton)`
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    align-self: baseline;
`;

const StyledTableRow = styled(GoalListItemCompactCustomize)`
    display: contents;
    position: relative;

    & > div,
    & > div:first-child,
    & > div:last-child {
        padding-top: 0;
        padding-bottom: 0;
    }

    & > div:first-child {
        padding-right: 0.7rem;
    }

    & ${StyledCleanButton} {
        position: relative;
        top: unset;
        right: unset;
    }

    &:hover {
        & ${StyledCleanButton} {
            visibility: visible;
            opacity: 1;
        }

        & ${ContentItem}, & ${TitleItem} {
            background-color: unset;
        }
    }
`;

interface GoalDependencyListItemProps {
    shortId: string;
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    state?: State;
    estimate?: Estimate;
    canEdit: boolean;
    onRemove: () => void;
}

const GoalDependencyListItem: React.FC<GoalDependencyListItemProps> = ({ onRemove, canEdit, ...props }) => {
    const onRemoveHandler = useCallback<React.MouseEventHandler>(
        (event) => {
            event.preventDefault();
            onRemove();
        },
        [onRemove],
    );
    return (
        <StyledTableRow
            forwardedAs="div"
            item={props}
            columns={[
                {
                    name: 'title',
                    renderColumn: (values) => (
                        <TitleItem>
                            <StyledTitleContainer>
                                <NextLink passHref href={routes.goal(props.shortId)}>
                                    <Title size="s" weight="bold">
                                        {values.title}
                                    </Title>
                                </NextLink>
                            </StyledTitleContainer>
                            {nullable(canEdit, () => (
                                <StyledCleanButton onClick={onRemoveHandler} />
                            ))}
                        </TitleItem>
                    ),
                },
                { name: 'state' },
                { name: 'projectId' },
                {
                    name: 'issuers',
                    renderColumn: (values) => (
                        <ContentItem>
                            <UserGroup users={values.issuers} size={18} />
                        </ContentItem>
                    ),
                },
                { name: 'estimate' },
            ]}
        />
    );
};

interface GoalDependencyListByKindProps<T> {
    goalId: string;
    kind: dependencyKind;
    items: T[];
    canEdit: boolean;
    onRemove: (values: ToggleGoalDependency) => void;
    children: React.ReactNode;
}

export function GoalDependencyListByKind<T extends GoalDependencyItem>({
    kind,
    goalId,
    items = [],
    canEdit,
    onRemove,
    children,
}: GoalDependencyListByKindProps<T>): React.ReactElement {
    const onRemoveHandler = useCallback(
        (item: T) => {
            onRemove({
                relation: { id: item.id },
                id: goalId,
                kind,
            });
        },
        [kind, onRemove, goalId],
    );

    const heading = useMemo(() => {
        return {
            [dependencyKind.blocks]: tr('blocks'),
            [dependencyKind.dependsOn]: tr('dependsOn'),
            [dependencyKind.relatedTo]: tr('relatesTo'),
        };
    }, []);

    return (
        <ActivityFeedItem>
            <Circle size={32}>
                <CircleIconInner as={MessageTextAltIcon} size="s" color={backgroundColor} />
            </Circle>
            <StyledWrapper>
                {nullable(items.length, () => (
                    <>
                        <StyledHeadingWrapper>
                            <Text color={gray6} weight="thin">
                                {heading[kind]}
                            </Text>
                        </StyledHeadingWrapper>
                        <StyledTable columns={6}>
                            {items.map((item) => (
                                <GoalDependencyListItem
                                    key={item.id}
                                    canEdit={canEdit}
                                    projectId={item.projectId}
                                    title={item.title}
                                    state={item.state ?? undefined}
                                    issuer={item.activity ?? undefined}
                                    owner={item.owner!}
                                    shortId={`${item.projectId}-${item.scopeId}`}
                                    estimate={item.estimate[item.estimate.length - 1]?.estimate}
                                    onRemove={() => onRemoveHandler(item)}
                                />
                            ))}
                        </StyledTable>
                    </>
                ))}
                {children}
            </StyledWrapper>
        </ActivityFeedItem>
    );
}
