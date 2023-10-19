import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Text, nullable, Table } from '@taskany/bricks';
import { backgroundColor, danger0, gray4, gray9, textColor } from '@taskany/colors';
import { IconBinOutline, IconMessageTextAltOutline } from '@taskany/icons';
import { State } from '@prisma/client';
import NextLink from 'next/link';

import { ActivityFeedItem } from '../ActivityFeed';
import { DateType } from '../../types/date';
import { ToggleGoalDependency, dependencyKind } from '../../schema/goal';
import { ActivityByIdReturnType, GoalDependencyItem } from '../../../trpc/inferredTypes';
import { Circle } from '../Circle';
import { ContentItem, Title } from '../Table';
import { CustomCell, GoalListItemCompact } from '../GoalListItemCompact';
import { routes } from '../../hooks/router';
import { UserGroup } from '../UserGroup';
import { BetaBadge } from '../BetaBadge';

import { tr } from './GoalDependencyList.i18n';

const StyledBetaMark = styled(BetaBadge)`
    right: -10px;
`;

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;
const StyledHeadingWrapper = styled.div`
    height: 32px;
    display: flex;
    align-items: center;
`;

const StyledTable = styled(Table)`
    grid-template-columns: 15px minmax(40%, 350px) max-content repeat(4, max-content);
    column-gap: 10px;
    row-gap: 5px;
    padding: 0;
    margin: 0;
    margin-bottom: 10px;
`;

const StyledGoalListItemCompact = styled(GoalListItemCompact)`
    position: relative;
    align-items: center;

    &:hover {
        & ${ContentItem} {
            background-color: unset;
        }
    }
`;

const StyledTitle = styled(Title)`
    text-decoration: none;
    color: ${textColor};

    &:visited {
        color: ${textColor};
    }
`;

const StyledTextHeading = styled(Text)`
    border-bottom: 1px solid ${gray4};
    display: grid;
    grid-template-columns: minmax(375px, 40%) max-content;
    width: 100%;
    max-width: calc(40% + 15px + 10px);
`;

interface GoalDependencyListItemProps {
    shortId: string;
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    state?: State;
    estimate?: Date | null;
    estimateType?: DateType | null;
    canEdit: boolean;
    onRemove: () => void;
    onClick?: () => void;
}

const GoalDependencyListItem: React.FC<GoalDependencyListItemProps> = ({
    onRemove,
    onClick,
    shortId,
    canEdit,
    ...props
}) => {
    const availableActions = useMemo(() => {
        if (!canEdit) {
            return;
        }

        return [
            {
                label: tr('Delete'),
                color: danger0,
                handler: onRemove,
                icon: <IconBinOutline size="xxs" />,
            },
        ];
    }, [canEdit, onRemove]);

    const onClickHandler = useCallback(
        (e: React.MouseEvent) => {
            if (onClick) {
                e.preventDefault();
                onClick();
            }
        },
        [onClick],
    );

    return (
        <StyledGoalListItemCompact
            icon
            forwardedAs="div"
            item={props}
            actions={availableActions}
            onActionClick={({ handler }) => handler()}
            columns={[
                {
                    name: 'title',
                    renderColumn: (values) => (
                        <CustomCell col={6}>
                            <NextLink passHref href={routes.goal(shortId)} legacyBehavior>
                                <StyledTitle size="s" weight="bold" onClick={onClickHandler} as="a">
                                    {values.title}
                                </StyledTitle>
                            </NextLink>
                        </CustomCell>
                    ),
                },
                {
                    name: 'state',
                    columnProps: {
                        min: true,
                    },
                },
                {
                    name: 'projectId',
                    columnProps: {
                        col: 1,
                    },
                },
                {
                    name: 'issuers',
                    renderColumn: (values) => (
                        <CustomCell align="start" width={45}>
                            <UserGroup users={values.issuers} size={18} />
                        </CustomCell>
                    ),
                },
                { name: 'estimate', columnProps: { width: '7ch' } },
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
    onClick?: (item: T) => void;
    children: React.ReactNode;
    showBeta?: boolean;
}

export function GoalDependencyListByKind<T extends GoalDependencyItem>({
    kind,
    goalId,
    items = [],
    showBeta,
    canEdit,
    onRemove,
    onClick,
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
                <IconMessageTextAltOutline size="s" color={backgroundColor} />
                {showBeta && <StyledBetaMark />}
            </Circle>
            <StyledWrapper>
                {nullable(items.length, () => (
                    <>
                        <StyledHeadingWrapper>
                            <StyledTextHeading size="s" weight="bold" color={gray9}>
                                {heading[kind]}
                            </StyledTextHeading>
                        </StyledHeadingWrapper>
                        <StyledTable gap={10}>
                            {items.map((item) => (
                                <GoalDependencyListItem
                                    key={item.id}
                                    canEdit={canEdit}
                                    projectId={item.projectId}
                                    title={item.title}
                                    state={item.state ?? undefined}
                                    issuer={item.activity ?? undefined}
                                    owner={item.owner ?? undefined}
                                    shortId={`${item.projectId}-${item.scopeId}`}
                                    estimate={item.estimate}
                                    estimateType={item.estimateType}
                                    onRemove={() => onRemoveHandler(item)}
                                    onClick={onClick ? () => onClick(item) : undefined}
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
