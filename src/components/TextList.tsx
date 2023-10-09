import React from 'react';
import styled from 'styled-components';

interface TextListProps {
    type?: 'ordered' | 'unordered';
    listStyle?: React.CSSProperties['listStyle'];
    className?: string;
    children?: React.ReactNode;
}

const StyledList = styled.ul<{ listStyle?: TextListProps['listStyle'] }>`
    margin: 0;
    padding: 0;

    line-height: inherit;
    font-size: inherit;
    font-weight: inherit;

    ${({ listStyle }) =>
        listStyle &&
        `
        list-style: ${listStyle};
    `}
`;

export const TextList: React.FC<TextListProps> = ({ type = 'unordered', listStyle, className, children }) => {
    return (
        <StyledList as={type === 'ordered' ? 'ol' : 'ul'} listStyle={listStyle} className={className}>
            {children}
        </StyledList>
    );
};

export const TextListItem = styled.li`
    padding: 0;

    line-height: inherit;
    font-size: inherit;
    font-weight: inherit;
`;
