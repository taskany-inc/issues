/* eslint-disable react/display-name */
import React from 'react';
import { FieldError } from 'react-hook-form';
import styled, { css } from 'styled-components';

import { gray3, textColor } from '../design/@generated/themes';

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
    style?: React.CSSProperties;
    flat?: 'top' | 'bottom' | 'both';

    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onInput?: React.ChangeEventHandler<HTMLTextAreaElement>;
    onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
    onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;

    error?: FieldError;
}

const StyledFormTextarea = styled(({ flat, forwardRef, ...props }) => <textarea ref={forwardRef} {...props} />)`
    outline: none;
    border: 0;
    border-radius: 4px;
    background-color: ${gray3};
    color: ${textColor};
    font-weight: 600;
    font-size: 16px;
    padding: 8px 16px;
    width: 100%;
    min-height: 200px;
    resize: none;

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
`;

export const FormTextarea = React.forwardRef<FormTextareaProps, FormTextareaProps>((props, ref) => {
    return <StyledFormTextarea forwardRef={ref} {...props} />;
});
