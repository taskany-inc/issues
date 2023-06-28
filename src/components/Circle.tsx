import styled, { css } from 'styled-components';

interface CircleProps {
    size: number;
}

export const Circle = styled.span<CircleProps>`
    border-radius: 50%;
    overflow: hidden;

    ${({ size }) => css`
        width: ${size}px;
        height: ${size}px;
    `}
`;
