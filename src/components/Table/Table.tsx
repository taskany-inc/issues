import { TableRow } from '@taskany/bricks';
import { Text } from '@taskany/bricks/harmony';
import { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import cn from 'classnames';

import s from './Table.module.css';

type TextProps = ComponentProps<typeof Text>;

export const Title = ({ children, ...props }: TextProps) => (
    <Text weight="bold" {...props}>
        {children}
    </Text>
);

export const TextItem = ({ children, className, ...props }: TextProps & { className?: string }) => (
    <Text size="s" weight="bold" className={cn(s.TextItem, className)} {...props}>
        {children}
    </Text>
);

interface TableRowItemProps extends Omit<React.ComponentProps<typeof TableRow>, 'interactive'> {
    title: ReactNode;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}

export const TableRowItem = ({ title, children, onClick, ...attrs }: TableRowItemProps) => {
    return (
        <TableRow className={s.TableRow} onClick={onClick} interactive {...attrs}>
            {title}
            {children}
        </TableRow>
    );
};
