import React from 'react';
import styled from 'styled-components';
import { gray2, gray3, gray7, radiusS, textColor } from '@taskany/colors';

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

const StyledFormTextarea = styled(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ flat, forwardRef, ...props }: FormTextareaProps & { forwardRef?: React.Ref<HTMLTextAreaElement> }) => (
        <textarea ref={forwardRef} {...props} />
    ),
)`
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

    &:focus:not([disabled]) {
        background-color: ${gray2};
    }

    &:hover:not([disabled]) {
        background-color: ${gray2};
    }

    ${({ flat }) =>
        flat === 'top' &&
        `
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'bottom' &&
        `
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
        `}

    ${({ flat }) =>
        flat === 'both' &&
        `
            border-radius: 0;
        `}

    ::placeholder {
        font-weight: 400;
        color: ${gray7};
    }
`;

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>((props, ref) => {
    return <StyledFormTextarea forwardRef={ref} {...props} />;
});
