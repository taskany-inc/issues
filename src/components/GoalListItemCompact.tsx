import React, { MouseEventHandler, useMemo } from 'react';
import NextLink from 'next/link';
import { nullable, GoalIcon } from '@taskany/bricks';
import type { Estimate, State as StateType } from '@prisma/client';

import { routes } from '../hooks/router';
import { Priority } from '../types/priority';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { estimateToString } from '../utils/estimateToString';

import { getPriorityText } from './PriorityText/PriorityText';
import { UserGroup } from './UserGroup';
import { TableRow, ContentItem, TitleItem, TitleContainer, Title, TextItem } from './Table';
import { StateDot } from './StateDot';

interface CommonGoalListItemCompactProps {
    shortId: string;
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    state?: StateType;
    estimate?: Estimate;
    focused?: boolean;
    priority?: string;
}

type GoalListItemCompactProps = {
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
} & CommonGoalListItemCompactProps;

export const GoalListItemCompact: React.FC<GoalListItemCompactProps> = React.memo(
    ({ shortId, projectId, owner, issuer, title, state, focused, estimate, priority, className, onClick }) => {
        const issuers = useMemo(() => {
            if (issuer && owner && owner.id === issuer.id) {
                return [owner];
            }

            return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
        }, [issuer, owner]);

        return (
            <NextLink href={routes.goal(shortId)} passHref>
                <TableRow as="a" focused={focused} onClick={onClick} className={className}>
                    <ContentItem>
                        <GoalIcon size="s" />
                    </ContentItem>
                    <TitleItem>
                        <TitleContainer>
                            <Title size="s" weight="bold">
                                {title}
                            </Title>
                        </TitleContainer>
                    </TitleItem>
                    <ContentItem>
                        {nullable(state, (s) => (
                            <StateDot size="m" title={s?.title} hue={s?.hue} />
                        ))}
                    </ContentItem>
                    <ContentItem>
                        <TextItem weight="regular">{getPriorityText(priority as Priority)}</TextItem>
                    </ContentItem>

                    <ContentItem>
                        <TextItem>{projectId}</TextItem>
                    </ContentItem>

                    <ContentItem align="center">
                        <UserGroup users={issuers} />
                    </ContentItem>

                    <ContentItem>
                        <TextItem>{nullable(estimate, (e) => estimateToString(e))}</TextItem>
                    </ContentItem>
                </TableRow>
            </NextLink>
        );
    },
);

type ColumnRenderProps<T extends GoalListItemCompactProps> = Omit<
    T,
    'onClick' | 'className' | 'focused' | 'owner' | 'issuer'
> & {
    issuers: Array<ActivityByIdReturnType>;
};

type GoalListItemCompactColumnProps<T = any> = {
    name: 'icon' | 'title' | 'state' | 'priority' | 'projectId' | 'issuers' | 'estimate' | string;
    renderColumn?: (props: T) => React.ReactElement<T>;
    columnProps?: React.ComponentProps<typeof ContentItem>;
};

interface GoalListItemCompactCustomizeProps<T extends GoalListItemCompactProps> {
    item: T;
    columns: Array<GoalListItemCompactColumnProps<ColumnRenderProps<T>>>;
    onClick?: React.MouseEventHandler;
    focused?: boolean;
    forwardedAs?: keyof JSX.IntrinsicElements;
    className?: string;
}

interface GoalListItemCompactCustomizeRender {
    <T extends GoalListItemCompactProps>(props: GoalListItemCompactCustomizeProps<T>): React.ReactElement<T>;
}

interface RenderColumnProps<T> {
    col: GoalListItemCompactColumnProps;
    componentProps: T;
}

interface ColumnRender {
    <T extends GoalListItemCompactProps>(props: RenderColumnProps<T>): React.ReactElement | null;
}

const Column: ColumnRender = ({ col, componentProps }) => {
    const issuers = useMemo(() => {
        const { issuer, owner } = componentProps;
        if (issuer && owner && owner.id === issuer.id) {
            return [owner];
        }

        return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
    }, [componentProps]);

    if (col.renderColumn != null) {
        return col.renderColumn({ ...componentProps, issuers });
    }

    const { title, state, priority, projectId, estimate } = componentProps;

    const columnProps = col.columnProps == null ? {} : col.columnProps;

    switch (col.name) {
        case 'title':
            return (
                <TitleItem {...columnProps}>
                    <TitleContainer>
                        <Title size="s" weight="bold">
                            {title}
                        </Title>
                    </TitleContainer>
                </TitleItem>
            );
        case 'state':
            return (
                <ContentItem {...columnProps}>
                    {nullable(state, (s) => (
                        <StateDot size="m" title={s?.title} hue={s?.hue} />
                    ))}
                </ContentItem>
            );
        case 'priority':
            return (
                <ContentItem {...columnProps}>
                    <TextItem weight="regular">{getPriorityText(priority as Priority)}</TextItem>
                </ContentItem>
            );
        case 'projectId':
            return (
                <ContentItem {...columnProps}>
                    <TextItem>{projectId}</TextItem>
                </ContentItem>
            );
        case 'issuers':
            return (
                <ContentItem align="center" {...columnProps}>
                    <UserGroup users={issuers} />
                </ContentItem>
            );
        case 'estimate':
            return (
                <ContentItem {...columnProps}>
                    <TextItem>{nullable(estimate, (e) => estimateToString(e))}</TextItem>
                </ContentItem>
            );
        default:
            return null;
    }
};

export const GoalListItemCompactCustomize: GoalListItemCompactCustomizeRender = ({
    columns,
    forwardedAs,
    onClick,
    className,
    focused,
    item,
}) => {
    return (
        <TableRow as={forwardedAs} onClick={onClick} className={className} focused={focused}>
            <ContentItem key="icon">
                <GoalIcon size="s" />
            </ContentItem>
            {columns.map((col) => (
                <Column key={col.name} col={col} componentProps={item} />
            ))}
        </TableRow>
    );
};
