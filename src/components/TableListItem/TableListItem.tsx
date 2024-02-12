import { ComponentProps, FC, HTMLAttributes, MouseEventHandler } from 'react';
import cn from 'classnames';
import { TableRow, TableCell } from '@taskany/bricks/harmony';

import s from './TableListItem.module.css';

interface TableListItemElementProps extends ComponentProps<typeof TableCell> {}

export const TableListItemElement: FC<TableListItemElementProps> = ({ className, children, ...rest }) => (
    <TableCell className={cn(s.Column, className)} {...rest}>
        {children}
    </TableCell>
);

interface TableListItemProps extends HTMLAttributes<HTMLDivElement> {
    selected?: boolean;
    hovered?: boolean;
    className?: string;
    onClick?: MouseEventHandler<HTMLElement>;
}

export const TableListItem: FC<TableListItemProps> = ({ children, selected, hovered, className, ...rest }) => {
    return (
        <TableRow className={cn(s.Row, { [s.Row_selected]: selected, [s.Row_hovered]: hovered }, className)} {...rest}>
            {children}
        </TableRow>
    );
};
