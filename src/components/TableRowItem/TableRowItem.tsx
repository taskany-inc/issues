import cn from 'classnames';
import { TableRow, Text } from '@taskany/bricks/harmony';
import { ComponentProps, MouseEventHandler, ReactNode } from 'react';

import s from './TableRowItem.module.css';

export const TableRowItemTitle = (props: ComponentProps<typeof Text>) => <Text weight="bold" {...props} />;

export const TableRowItemText = ({ className, ...props }: ComponentProps<typeof Text>) => (
    <Text className={cn(s.TableRowItemText, className)} size="s" weight="bold" {...props} />
);

interface TableRowItemProps extends Omit<React.ComponentProps<typeof TableRow>, 'title'> {
    title: ReactNode;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}

export const TableRowItem = ({ title, children, onClick, className, ...attrs }: TableRowItemProps) => {
    return (
        <div className={cn(s.TableRowItem, className)} onClick={onClick} {...attrs}>
            {title}
            {children}
        </div>
    );
};
