import React from 'react';
import { Text, nullable } from '@taskany/bricks';
import { gapXs, gray9 } from '@taskany/colors';
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
    // FIXME: drop after update @taskany/bricks to 4.0.2+
    pointer-events: all;
`;

const StyledBreakText = styled(Text)`
    word-break: break-all;
`;

export const FilterTabLabel: React.FC<TabLabelProps> = ({ text, selected }) => (
    <StyledLabelWrapper>
        <Text color={gray9}>
            {text}
            {nullable(selected, () => ': ')}
        </Text>
        {nullable(selected, (list) => (
            <StyledBreakText ellipsis lines={1} title={list.join(', ')}>
                {list.join(', ')}
            </StyledBreakText>
        ))}
    </StyledLabelWrapper>
);
