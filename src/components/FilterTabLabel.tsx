import React from 'react';
import { Text, nullable } from '@taskany/bricks';
import { gapXs, gray10 } from '@taskany/colors';
import styled from 'styled-components';

interface TabLabelProps {
    text: string;
    selected?: string[];
}

const StyledLabelWrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: ${gapXs};
    width: 100%;
`;

const StyledBreakText = styled(Text)`
    word-break: break-all;
`;

export const FilterTabLabel: React.FC<TabLabelProps> = ({ text, selected }) => (
    <StyledLabelWrapper>
        <Text>
            {text}
            {`${selected?.length ? ': ' : ''}`}
        </Text>
        {nullable(selected, (list) => (
            <StyledBreakText ellipsis lines={1} color={gray10}>
                {list.join(', ')}
            </StyledBreakText>
        ))}
    </StyledLabelWrapper>
);
