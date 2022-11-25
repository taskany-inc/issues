import React from 'react';
import styled, { css } from 'styled-components';

import { gray2, gray3, gray7, radiusS, textColor } from '../design/@generated/themes';

interface FormTextareaProps {
    id?: string;
    name?: string;
    value?: string | number;
    defaultValue?: string | number;
    tabIndex?: number;
    autoFocus?: boolean;
    autoComplete?: string;
    placeholder?: string;
    disabled?: boolean;
    flat?: 'top' | 'bottom' | 'both';
    error?: {
        message?: string;
    };

    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onInput?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledFormTextarea = styled(({ flat, forwardRef, ...props }) => <textarea ref={forwardRef} {...props} />)`
    box-sizing: border-box;
    outline: none;
    border: 0;
    border-radius: ${radiusS};
    background-color: ${gray3};
    color: ${textColor};
    font-weight: 600;
    font-size: 16px;
    padding: 8px 16px;
    width: 100%;
    min-height: 200px;
    resize: none;

    transition: 200ms cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color, background-color, border-color;

    :focus:not([disabled]) {
        background-color: ${gray2};
    }

    :hover:not([disabled]) {
        background-color: ${gray2};
    }

    ${({ flat }) =>
        flat === 'top' &&
        css`
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'bottom' &&
        css`
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'both' &&
        css`
            border-radius: 0;
        `}

    ::placeholder {
        font-weight: 400;
        color: ${gray7};
    }
`;

export const FormTextarea = React.forwardRef<FormTextareaProps, FormTextareaProps>((props, ref) => {
    return <StyledFormTextarea forwardRef={ref} {...props} />;
});
