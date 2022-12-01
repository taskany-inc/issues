import React from 'react';
import styled, { css } from 'styled-components';

import { gapS, gray2 } from '../design/@generated/themes';

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
        css`
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        `}

    ${({ brick }) =>
        brick === 'right' &&
        css`
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `}

    ${({ brick }) =>
        brick === 'center' &&
        css`
            border-radius: 0;
        `}

     ${({ focused, hovered }) =>
        (focused || hovered) &&
        css`
            background-color: ${gray2};
        `}
`;
