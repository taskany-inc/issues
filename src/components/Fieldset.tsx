import React from 'react';
import styled from 'styled-components';

import { gapM, gray9 } from '../design/@generated/themes';

import { Text } from './Text';

interface FieldsetProps {
    title?: string;
}

const StyledFieldset = styled.fieldset`
    border: 0;

    padding: ${gapM} 0 0 0;
    margin: 0;
`;

export const Fieldset: React.FC<FieldsetProps> = ({ title, children }) => {
    return (
        <StyledFieldset>
            <Text as="legend" size="m" weight="bold" color={gray9}>
                {title}
            </Text>

            {children}
        </StyledFieldset>
    );
};
