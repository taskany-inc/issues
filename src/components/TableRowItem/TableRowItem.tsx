import styled from 'styled-components';
import cn from 'classnames';
import { TableRow } from '@taskany/bricks/harmony';
import { Text } from '@taskany/bricks';
import { MouseEventHandler, ReactNode } from 'react';

import s from './TableRowItem.module.css';

export const TableRowItemTitle = styled(Text).attrs((props) => ({ weight: 'bold', ...props }))``;

export const TableRowItemText = styled(Text).attrs({
    size: 's',
    weight: 'bold',
    color: 'var(--gray9)',
})``;

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
