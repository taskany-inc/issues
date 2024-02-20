import styled from 'styled-components';
import { TableRow, Text } from '@taskany/bricks';
import { MouseEventHandler, ReactNode } from 'react';

export const Title = styled(Text).attrs((props) => ({ weight: 'bold', ...props }))``;

export const TextItem = styled(Text).attrs({
    size: 's',
    weight: 'bold',
    color: 'var(--gray9)',
})``;

const TableRowWrapper = styled(TableRow)`
    display: grid;
    grid-template-columns: minmax(400px, 1fr) 780px;
    align-items: center;
    flex: 1;

    color: var(--text-color);
    padding: var(--gap-s);
    border-radius: var(--radius-m);
`;

interface TableRowItemProps extends Omit<React.ComponentProps<typeof TableRow>, 'interactive'> {
    title: ReactNode;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}

export const TableRowItem = ({ title, children, onClick, ...attrs }: TableRowItemProps) => {
    return (
        <TableRowWrapper onClick={onClick} interactive {...attrs}>
            {title}
            {children}
        </TableRowWrapper>
    );
};
