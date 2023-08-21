import { gapM, gapS, gapXs, gray3 } from '@taskany/colors';
import React from 'react';
import styled from 'styled-components';

type ListType = 'ordered' | 'unordered';

interface TextListProps {
    type?: ListType;
    className?: string;
    children?: React.ReactNode;
    heading?: React.ReactNode;
}

const StyledList = styled.ul`
    margin: ${gapXs} 0;
    padding-left: ${gapM};
    list-style: none;
`;

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${gray3};
    padding: ${gapS};
`;

const tag = {
    ordered: 'ol',
    unordered: 'ul',
} as const;

export const TextList: React.FC<TextListProps> = ({ type = 'unordered', className, children, heading }) => {
    const asProp = tag[type];

    return (
        <StyledWrapper className={className}>
            {heading}
            <StyledList as={asProp}>{children}</StyledList>
        </StyledWrapper>
    );
};

export const TextListItem = styled.li`
    padding-left: ${gapS};
`;
