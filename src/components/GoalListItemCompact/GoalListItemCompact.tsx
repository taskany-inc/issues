import React, { ComponentProps, FC, MouseEventHandler, useMemo } from 'react';
import cn from 'classnames';
import { nullable } from '@taskany/bricks';
import { TableRow, TableCell, UserGroup } from '@taskany/bricks/harmony';
import { IconTargetOutline } from '@taskany/icons';
import type { State as StateType } from '@prisma/client';

import { DateType } from '../../types/date';
import { safeUserData } from '../../utils/getUserName';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { formateEstimate } from '../../utils/dateTime';
import { useLocale } from '../../hooks/useLocale';
import { Priority } from '../../types/priority';
import { getPriorityText } from '../PriorityText/PriorityText';
import { TableRowItemText, TableRowItemTitle } from '../TableRowItem/TableRowItem';
import { StateDot } from '../StateDot/StateDot';
import { getStateProps } from '../GoalBadge';

import s from './GoalListItemCompact.module.css';

interface CommonGoalListItemCompactProps {
    shortId: string;
    projectId: string | null;
    title: string;
    owner?: ActivityByIdReturnType;
    issuer?: ActivityByIdReturnType;
    state?: StateType;
    estimate?: Date;
    estimateType?: DateType;
    focused?: boolean;
    priority?: Priority;
}

type GoalListItemCompactProps = {
    className?: string;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
} & CommonGoalListItemCompactProps;

type ColumnRenderProps<T extends Record<string, any>> = T &
    Omit<GoalListItemCompactProps, 'onClick' | 'className' | 'focused' | 'owner' | 'issuer'> & {
        issuers: Array<ActivityByIdReturnType>;
    };

type Justify = 'start' | 'center' | 'end';
type TableCellProps = ComponentProps<typeof TableCell> & {
    forIcon?: boolean;
    justify?: Justify;
};

type GoalListItemCompactColumnProps<T = any> = {
    name: 'icon' | 'title' | 'state' | 'priority' | 'projectId' | 'issuers' | 'estimate' | string;
    renderColumn?: (props: T) => React.ReactElement<T>;
    columnProps?: TableCellProps;
};

type CanBeNullableValue<T> = { [K in keyof T]?: T[K] | null };

interface GoalListItemCompactCustomizeProps<T extends Record<string, any>> {
    item: T & CanBeNullableValue<CommonGoalListItemCompactProps>;
    icon?: boolean;
    rawIcon?: React.ReactNode;
    columns: Array<GoalListItemCompactColumnProps<ColumnRenderProps<T>>>;
    focused?: boolean;
    forwardedAs?: keyof JSX.IntrinsicElements;
    className?: string;

    onClick?: React.MouseEventHandler;
}

interface GoalListItemCompactCustomizeRender {
    <T extends Record<string, any>>(props: GoalListItemCompactCustomizeProps<T>): React.ReactElement<T>;
}

interface RenderColumnProps<T> {
    col: GoalListItemCompactColumnProps;
    componentProps: CanBeNullableValue<T>;
}

interface ColumnRender {
    <T extends GoalListItemCompactProps>(props: RenderColumnProps<T>): React.ReactNode;
}

const justifyCns: Record<Justify, string> = {
    start: s.GoalListItemCompactCellStart,
    center: s.GoalListItemCompactCellCenter,
    end: s.GoalListItemCompactCellEnd,
};

export const CustomCell: FC<TableCellProps> = ({ forIcon, justify = 'start', className, ...props }) => (
    <TableCell
        className={cn(
            className,
            {
                [s.GoalListItemCompactCellforIcon]: forIcon,
            },
            justifyCns[justify],
        )}
        {...props}
    />
);

const Column: ColumnRender = ({ col, componentProps }) => {
    const locale = useLocale();
    const issuers = useMemo(() => {
        const { issuer, owner } = componentProps;
        if (issuer && owner && owner.id === issuer.id) {
            return [owner];
        }

        return [issuer, owner].filter(Boolean) as NonNullable<ActivityByIdReturnType>[];
    }, [componentProps]);

    const issuersUsers = useMemo(() => issuers.map(safeUserData).filter(Boolean), [issuers]);

    if (col.renderColumn != null) {
        return col.renderColumn({ ...componentProps, issuers });
    }

    const { title, state, priority, projectId, estimate, estimateType } = componentProps;

    const columnProps = col.columnProps == null ? {} : col.columnProps;

    let content: React.ReactNode;

    switch (col.name) {
        case 'title':
            content = <TableRowItemTitle size="s">{title}</TableRowItemTitle>;
            break;
        case 'state':
            content = nullable(state, (s) => <StateDot state={getStateProps(s)} size="l" title={s?.title} />);
            break;
        case 'priority':
            content = nullable(priority, (p) => <TableRowItemText>{getPriorityText(p.title)}</TableRowItemText>);
            break;
        case 'projectId':
            content = nullable(projectId, (id) => <TableRowItemText>{id}</TableRowItemText>);
            break;
        case 'issuers':
            content = nullable(issuersUsers, (users) => <UserGroup users={users} />);
            break;
        case 'estimate':
            content = nullable(estimate, (e) => (
                <TableRowItemText>
                    {formateEstimate(e, {
                        type: estimateType === 'Year' ? estimateType : 'Quarter',
                        locale,
                    })}
                </TableRowItemText>
            ));
            break;
        default:
            return null;
    }

    return nullable(content, (c) => <CustomCell {...columnProps}>{c}</CustomCell>);
};

export const GoalListItemCompact: GoalListItemCompactCustomizeRender = ({
    columns,
    icon,
    rawIcon = <IconTargetOutline size="s" />,
    item,
    ...attrs
}) => {
    return (
        <TableRow className={s.GoalListItemCompactRow} {...attrs}>
            {nullable(icon, () => (
                <CustomCell key="icon" forIcon>
                    {rawIcon}
                </CustomCell>
            ))}
            {columns.map((col) => (
                <Column key={col.name} col={col} componentProps={item} />
            ))}
        </TableRow>
    );
};
