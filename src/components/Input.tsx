/* eslint-disable react/display-name */
import React from 'react';
import styled, { css } from 'styled-components';

import { gray10, gray3, gray4, gray6, gray7, radiusM, textColor } from '../design/@generated/themes';

interface InputProps {
    id?: string;
    name?: string;
    value?: string | number;
    defaultValue?: string | number;
    tabIndex?: number;
    autoFocus?: boolean;
    autoComplete?: string;
    placeholder?: string;
    disabled?: boolean;
    view?: 'default' | 'primary' | 'warning' | 'danger';
    size?: 's' | 'm' | 'l';
    className?: string;

    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onInput?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledInput = styled(({ forwardRef, size, view, ...props }) => <input ref={forwardRef} {...props} />)<InputProps>`
    box-sizing: border-box;
    width: 100%;

    font-weight: 500;

    outline: none;
    border: 1px solid;
    border-radius: ${radiusM};

    transition: 200ms cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color, background-color, border-color;

    ${({ view }) =>
        view === 'default' &&
        css`
            color: ${gray10};
            border-color: ${gray6};
            background-color: ${gray4};

            :hover:not([disabled]),
            :focus:not([disabled]) {
                color: ${textColor};
                border-color: ${gray7};
                background-color: ${gray3};
            }
        `}

    ${({ size }) =>
        size === 'm' &&
        css`
            padding: 5px 8px;

            font-size: 13px;
        `}
`;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ view = 'default', size = 'm', ...props }, ref) => (
        <StyledInput forwardRef={ref} view={view} size={size} {...props} />
    ),
);
