import styled from 'styled-components';
import { gapS, gray6, gray9, radiusM, textColor } from '@taskany/colors';
import { Text } from '@taskany/bricks';
import { MouseEventHandler, ReactNode } from 'react';

export const Title = styled(Text).attrs((props) => ({ weight: 'bold', ...props }))``;

export const TextItem = styled(Text).attrs({
    size: 's',
    weight: 'bold',
    color: gray9,
})``;

const TableRowWrapper = styled.div`
    display: grid;
    grid-template-columns: 1fr 740px;
    align-items: center;
    flex: 1;

    color: ${textColor};
    padding: ${gapS};
    border-radius: ${radiusM};

    :hover {
        background-color: ${gray6};
        cursor: pointer;
    }
`;

interface TableRowItemProps {
    title: ReactNode;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLElement>;
}
export const TableRowItem = ({ title, children, onClick }: TableRowItemProps) => {
    return (
        <TableRowWrapper onClick={onClick}>
            {title}
            {children}
        </TableRowWrapper>
    );
};
