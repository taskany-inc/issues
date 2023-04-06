/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { danger10, gray2, gray3, gray8, radiusS, textColor } from '@taskany/colors';

import { nullable } from '../utils/nullable';

import { Text } from './Text';

const Popup = dynamic(() => import('./Popup'));

interface FormInputProps {
    id?: string;
    name?: string;
    label?: string;
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
    brick?: 'left' | 'right' | 'center';

    onMouseLeave?: React.MouseEventHandler<HTMLInputElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLInputElement>;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onInput?: React.ChangeEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
}

const StyledFormInputContainer = styled.div<{ flat: FormInputProps['flat'] }>`
    box-sizing: border-box;
    display: flex;
    align-items: center;
    position: relative;

    border-radius: ${radiusS};

    background-color: ${gray3};
    color: ${textColor};
    font-weight: 600;
    font-size: 22px;
    width: 100%;

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
`;

const StyledErrorTrigger = styled.div`
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 100%;
    background-color: ${danger10};
    top: 17px;
    left: -2px;
`;

const StyledFormInput = styled(
    ({
        flat,
        brick,
        error,
        label,
        forwardRef,
        ...props
    }: FormInputProps & { forwardRef?: React.Ref<HTMLInputElement> }) => <input ref={forwardRef} {...props} />,
)`
    box-sizing: border-box;
    outline: none;
    width: 100%;
    padding: 8px 16px;

    border: 0;
    border-radius: ${radiusS};

    background-color: transparent;

    color: ${textColor};
    font-weight: 600;
    font-size: 22px;

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

    ${({ disabled }) =>
        disabled &&
        `
            color: ${gray8};
            cursor: not-allowed;
        `}


    ${({ brick }) =>
        brick === 'left' &&
        `
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        `}

    ${({ brick }) =>
        brick === 'right' &&
        `
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        `}

    ${({ brick }) =>
        brick === 'center' &&
        `
            border-radius: 0;
        `}
`;

const StyledLabel = styled(Text)`
    padding: 8px 8px 8px 16px;

    background-color: transparent;
`;

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
    const [popupVisible, setPopupVisibility] = useState(false);
    const [inputFocused, setInputFocus] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (props.error && inputFocused) {
            setPopupVisibility(true);
        }
    }, [props.error, inputFocused, setPopupVisibility]);

    const onFocus = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setInputFocus(true);

            if (props.error) {
                setPopupVisibility(true);
            }

            if (props.onFocus) {
                props.onFocus(e);
            }
        },
        [props, setPopupVisibility, setInputFocus],
    );

    const onBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            setInputFocus(false);

            if (props.error) {
                setPopupVisibility(false);
            }

            if (props.onBlur) {
                props.onBlur(e);
            }
        },
        [props, setPopupVisibility, setInputFocus],
    );

    const onClickOutside = useCallback(() => setPopupVisibility(false), [setPopupVisibility]);

    return (
        <StyledFormInputContainer flat={props.flat}>
            {nullable(props.label, (l) => (
                <StyledLabel as="label" htmlFor={props.id || props.name} size="m" color={gray8} weight="bold">
                    {l}:
                </StyledLabel>
            ))}

            {nullable(props.error, (err) => (
                <>
                    <StyledErrorTrigger
                        ref={popupRef}
                        onMouseEnter={() => setPopupVisibility(true)}
                        onMouseLeave={() => setPopupVisibility(false)}
                    />
                    <Popup
                        tooltip
                        view="danger"
                        placement="top-start"
                        visible={popupVisible}
                        onClickOutside={onClickOutside}
                        reference={popupRef}
                    >
                        {err.message}
                    </Popup>
                </>
            ))}

            <StyledFormInput
                forwardRef={ref}
                {...props}
                id={props.id || props.name}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </StyledFormInputContainer>
    );
});
