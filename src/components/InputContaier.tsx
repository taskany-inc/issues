import React from 'react';
import styled from 'styled-components';
import { gapS, gray2 } from '@taskany/colors';

interface InputContainerProps {
    brick?: 'left' | 'right' | 'center';
    focused?: boolean;
    hovered?: boolean;
    children?: React.ReactNode;
}

export const InputContainer = styled.div<InputContainerProps>`
    display: flex;
    flex-direction: row;
    align-items: cemter;
    width: fit-content;
    height: 100%;
    align-items: center;
    position: relative;
    padding-right: ${gapS};

    ${({ brick }) =>
        brick === 'left' &&
        `
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        `}

    ${({ brick }) =>
        brick === 'right' &&
        `
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `}

    ${({ brick }) =>
        brick === 'center' &&
        `
            border-radius: 0;
        `}

     ${({ focused, hovered }) =>
        (focused || hovered) &&
        `
            background-color: ${gray2};
        `}
`;
