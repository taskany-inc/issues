import { gray7 } from '@taskany/colors';
import { forwardRef } from 'react';
import styled, { css } from 'styled-components';

interface CircleProps extends React.RefAttributes<HTMLSpanElement> {
    size: number;
    backgroundColor?: string;
    className?: string;
}

export const Circle = styled(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    forwardRef<HTMLSpanElement, React.PropsWithChildren<CircleProps>>(({ size, backgroundColor, ...props }, ref) => (
        <span {...props} ref={ref} />
    )),
)`
    display: flex;
    position: relative;
    z-index: 1;

    ${({ size }) => css`
        width: ${size}px;
        height: ${size}px;
    `}

    align-items: center;
    justify-content: center;
    box-sizing: border-box;

    text-align: center;
    background-color: ${({ backgroundColor = gray7 }) => backgroundColor};
    border-radius: 50%;
`;
