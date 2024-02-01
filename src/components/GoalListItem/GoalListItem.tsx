import { FC, HTMLAttributes, MouseEventHandler } from 'react';
import cn from 'classnames';
import { TableRow } from '@taskany/bricks/harmony';

import s from './GoalListItem.module.css';

interface GoalListItemProps extends HTMLAttributes<HTMLDivElement> {
    selected?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLElement>;
}

export const GoalListItem: FC<GoalListItemProps> = ({ children, selected, className, ...rest }) => {
    return (
        <TableRow className={cn(s.Row, { [s.Row_selected]: selected }, className)} {...rest}>
            {children}
        </TableRow>
    );
};
