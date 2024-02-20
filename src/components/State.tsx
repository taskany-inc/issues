import React from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { stateBg, stateBgHover, stateStroke, stateStrokeHover } from './StateWrapper';

const StateWrapper = dynamic(() => import('./StateWrapper'));

interface StateProps {
    title: string;
    hue?: number;
    size?: 's' | 'm';
    onClick?: () => void;
}

const StyledState = styled.div<{
    size: StateProps['size'];
    onClick: StateProps['onClick'];
}>`
    display: inline-block;
    padding: 6px 14px;

    border-radius: var(--radius-xl);

    font-size: 14px;
    line-height: 14px;
    font-weight: 700;
    user-select: none;

    cursor: default;

    transition: background-color, color, border-color 300ms ease-in-out;

    color: ${stateStroke};
    border: 3px solid ${stateStroke};
    background-color: ${stateBg};

    ${({ onClick }) =>
        onClick &&
        `
            cursor: pointer;

            &:hover {
                color: ${stateStrokeHover};
                border-color: ${stateStrokeHover};
                background-color: ${stateBgHover};
            }
        `}

    ${({ size }) =>
        size === 's' &&
        `
            padding: calc(var(--gap-xs)/2) var(--gap-s);
            font-size: 12px;
            border: 2px solid ${stateStroke};
            font-weight: 500;
        `}
`;

// eslint-disable-next-line react/display-name
export const State = React.forwardRef<HTMLDivElement, StateProps>(({ title, hue = 1, size = 'm', onClick }, ref) => {
    return (
        <StateWrapper hue={hue}>
            <StyledState ref={ref} size={size} onClick={onClick}>
                {title}
            </StyledState>
        </StateWrapper>
    );
});
