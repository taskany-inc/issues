/* eslint-disable react/display-name */
import React from 'react';
import styled, { css } from 'styled-components';

import { textColor, backgroundColor, colorPrimary, brandColor, gray9 } from '../design/@generated/themes';

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

    border: 1px solid ${gray9};
    color: ${gray9};

    ${({ action }) =>
        action &&
        css`
            border: 1px solid ${colorPrimary};
            color: ${brandColor};
        `}

    border-radius: 100%;

    cursor: pointer;

    transition: background-color, color 250ms ease-in-out;

    &:hover {
        font-weight: 500;
        font-size: 14px;

        border-color: ${textColor};
        color: ${textColor};

        ${({ action }) =>
            action &&
            css`
            border-color: ${colorPrimary}
            background-color: ${colorPrimary};
            color: ${backgroundColor};
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
