import React from 'react';
import { FieldError } from 'react-hook-form';
import styled, { css } from 'styled-components';

import { formInputBackgroundColor, textColorPrimary } from '../design/@generated/themes';

interface FormInputProps {
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

    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onInput?: React.ChangeEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;

    error?: FieldError;
}

const StyledFormInputContainer = styled.div<{ error?: FormInputProps['error'] }>`
    position: relative;

    ${({ error }) =>
        Boolean(error) &&
        css`
            &::before {
                content: ' ';
                position: absolute;
                width: 6px;
                height: 6px;
                border-radius: 100%;
                background-color: red;
                top: 45%;
                left: 4px;
            }
        `}
`;

const StyledFormInput = styled(({ flat, error, forwardRef, ...props }) => <input ref={forwardRef} {...props} />)`
    outline: none;
    border: 0;
    border-radius: 4px;
    background-color: ${formInputBackgroundColor};
    color: ${textColorPrimary};
    font-weight: 600;
    font-size: 22px;
    padding: 8px 16px;
    width: 100%;

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

export const FormInput = React.forwardRef<FormInputProps, FormInputProps>((props, ref) => {
    return (
        <StyledFormInputContainer error={props.error}>
            <StyledFormInput forwardRef={ref} {...props} />
        </StyledFormInputContainer>
    );
});
