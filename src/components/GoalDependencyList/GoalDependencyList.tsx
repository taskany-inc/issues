import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Text, nullable } from '@taskany/bricks';
import { backgroundColor, danger0, gray4, gray9 } from '@taskany/colors';
import { IconBinOutline, IconMessageTextAltOutline } from '@taskany/icons';
import { Estimate, State } from '@prisma/client';
import NextLink from 'next/link';

import { ActivityFeedItem } from '../ActivityFeed';
import { ToggleGoalDependency, dependencyKind } from '../../schema/goal';
import { ActivityByIdReturnType, GoalDependencyItem } from '../../../trpc/inferredTypes';
import { Circle, CircledIcon as CircleIconInner } from '../Circle';
import { ContentItem, Table, Title } from '../Table';
import { CustomCell, GoalListItemCompactCustomize } from '../GoalListItemCompact';
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

const StyledTableRow = styled(GoalListItemCompactCustomize)`
    display: contents;
    position: relative;

    &:hover {
        & ${ContentItem} {
            background-color: unset;
        }
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
    estimate?: Estimate;
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
        <StyledTableRow
            forwardedAs="div"
            item={props}
            actions={availableActions}
            onActionClick={({ handler }) => handler()}
            columns={[
                {
                    name: 'title',
                    renderColumn: (values) => (
                        <CustomCell>
                            <NextLink passHref href={routes.goal(shortId)} legacyBehavior>
                                <Title size="s" weight="bold" onClick={onClickHandler}>
                                    {values.title}
                                </Title>
                            </NextLink>
                        </CustomCell>
                    ),
                },
                { name: 'state' },
                { name: 'projectId' },
                {
                    name: 'issuers',
                    renderColumn: (values) => (
                        <CustomCell>
                            <UserGroup users={values.issuers} size={18} />
                        </CustomCell>
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
                <CircleIconInner as={IconMessageTextAltOutline} size="s" color={backgroundColor} />
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
                        <StyledTable columns={7}>
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
                                    estimate={item.estimate[item.estimate.length - 1]?.estimate}
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
