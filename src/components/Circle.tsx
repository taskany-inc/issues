import { gray7 } from '@taskany/colors';
import styled, { css } from 'styled-components';

interface CircleProps {
    size: number;
}

export const Circle = styled.span<CircleProps>`
    display: flex;
    border-radius: 50%;
    overflow: hidden;

    ${({ size }) => css`
        width: ${size}px;
        height: ${size}px;
    `}
`;

export const CircledIcon = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    text-align: center;
    background-color: ${gray7};

    width: 100%;
    height: 100%;
`;
