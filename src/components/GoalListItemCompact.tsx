import React, { MouseEventHandler, useMemo } from 'react';
import styled, { css } from 'styled-components';
import {
    nullable,
    GoalIcon,
    Dropdown,
    MenuItem,
    TableRow,
    TableCell,
    TableRowProps,
    TableCellProps,
} from '@taskany/bricks';
import { IconMoreVerticalOutline } from '@taskany/icons';
import type { Estimate, State as StateType } from '@prisma/client';

import { Priority } from '../types/priority';
import { ActivityByIdReturnType } from '../../trpc/inferredTypes';
import { estimateToString } from '../utils/estimateToString';

import { getPriorityText } from './PriorityText/PriorityText';
import { UserGroup } from './UserGroup';
import { Title, TextItem } from './Table';
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

type ColumnRenderProps<T extends Record<string, any>> = T &
    Omit<GoalListItemCompactProps, 'onClick' | 'className' | 'focused' | 'owner' | 'issuer'> & {
        issuers: Array<ActivityByIdReturnType>;
    };

type GoalListItemCompactColumnProps<T = any> = {
    name: 'icon' | 'title' | 'state' | 'priority' | 'projectId' | 'issuers' | 'estimate' | string;
    renderColumn?: (props: T) => React.ReactElement<T>;
    columnProps?: TableCellProps;
};

interface GoalItemAction {
    label: string;
    handler: () => void;
    color?: string;
    icon: React.ReactNode;
}

type CanBeNullableValue<T> = { [K in keyof T]?: T[K] | null };

interface GoalListItemCompactCustomizeProps<T extends Record<string, any>> {
    item: T & CanBeNullableValue<CommonGoalListItemCompactProps>;
    rowIcon?: React.ReactNode;
    actions?: Array<GoalItemAction>;
    onActionClick?: <A extends NonNullable<GoalListItemCompactCustomizeProps<T>['actions']>[number]>(action: A) => void;
    columns: Array<GoalListItemCompactColumnProps<ColumnRenderProps<T>>>;
    onClick?: React.MouseEventHandler;
    focused?: boolean;
    forwardedAs?: keyof JSX.IntrinsicElements;
    className?: string;
}

interface GoalListItemCompactCustomizeRender {
    <T extends Record<string, any>>(
        props: GoalListItemCompactCustomizeProps<T> & Omit<TableRowProps, 'interactive'>,
    ): React.ReactElement<T>;
}

interface RenderColumnProps<T> {
    col: GoalListItemCompactColumnProps;
    componentProps: CanBeNullableValue<T>;
}

interface ColumnRender {
    <T extends GoalListItemCompactProps>(props: RenderColumnProps<T>): React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledCell = styled(({ forIcon, ...props }: TableCellProps & { forIcon?: boolean }) => <TableCell {...props} />)`
    ${({ forIcon }) =>
        forIcon &&
        css`
            /* align icon be center of first line in title */
            transform: translateY(2px);

            &:last-child {
                margin-left: auto;
            }
        `}
`;

const StyledDropdown = styled(Dropdown)`
    position: relative;
    z-index: 1;
    max-width: 300px;
    width: 100%;
`;

const StyledActionsWrapper = styled.div`
    display: flex;
    position: relative;
    z-index: 1;
`;

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

    let content: React.ReactNode;

    switch (col.name) {
        case 'title':
            content = (
                <Title size="s" weight="bold">
                    {title}
                </Title>
            );
            break;
        case 'state':
            content = nullable(state, (s) => <StateDot size="m" title={s?.title} hue={s?.hue} />);
            break;
        case 'priority':
            content = nullable(priority as Priority | null, (p) => (
                <TextItem weight="regular">{getPriorityText(p)}</TextItem>
            ));
            break;
        case 'projectId':
            content = nullable(projectId, (id) => <TextItem>{id}</TextItem>);
            break;
        case 'issuers':
            content = nullable(issuers, (list) => <UserGroup users={list} />);
            break;
        case 'estimate':
            content = nullable(estimate, (e) => <TextItem>{estimateToString(e)}</TextItem>);
            break;
        default:
            return null;
    }

    return nullable(content, (c) => <StyledCell {...columnProps}>{c}</StyledCell>);
};

export const GoalListItemCompact: GoalListItemCompactCustomizeRender = ({
    columns,
    actions,
    rowIcon,
    onActionClick,
    onClick,
    className,
    item,
    gap = 7,
    align,
    justify,
    focused,
}) => {
    return (
        <TableRow
            onClick={onClick}
            className={className}
            interactive={focused != null}
            focused={focused}
            gap={gap}
            align={align}
            justify={justify}
        >
            <StyledCell key="icon" forIcon min>
                {rowIcon || <GoalIcon size="s" />}
            </StyledCell>
            {columns.map((col) => (
                <Column key={col.name} col={col} componentProps={item} />
            ))}
            <StyledCell key="actions" forIcon min>
                <StyledActionsWrapper>
                    {nullable(actions, (list) => (
                        <StyledDropdown
                            onChange={onActionClick}
                            renderTrigger={({ onClick }) => <IconMoreVerticalOutline size="xs" onClick={onClick} />}
                            placement="top-end"
                            items={list}
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
                </StyledActionsWrapper>
            </StyledCell>
        </TableRow>
    );
};

export const CustomCell = StyledCell;
