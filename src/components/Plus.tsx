import React from 'react';
import styled from 'styled-components';

interface PlusProps {
    action?: boolean;

    onClick?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledPlus = styled(({ action, forwardRef, ...props }) => <span ref={forwardRef} {...props} />)<PlusProps>`
    display: inline-block;
    box-sizing: border-box;
    width: 18px;
    height: 18px;

    font-size: 13px;
    line-height: 14px;
    text-align: center;
    font-weight: 400;

    border: 1px solid var(--gray9);
    color: var(--gray9);

    ${({ action }) =>
        action &&
        `
            border: 1px solid var(--color-primary);
            color: var(--brand-color);
        `}

    border-radius: 100%;

    cursor: pointer;

    transition: background-color, color 250ms ease-in-out;

    &:hover {
        font-weight: 500;
        font-size: 14px;

        border-color: var(--text-color);
        color: var(--text-color);

        ${({ action }) =>
            action &&
            `
                border-color: var(--color-primary)
                background-color: var(--color-primary);
                color: var(--background-color);
            `}
    }
`;

export const Plus = React.forwardRef<HTMLSpanElement, PlusProps>((props, ref) => {
    return (
        <StyledPlus forwardRef={ref} {...props}>
            +
        </StyledPlus>
    );
});
