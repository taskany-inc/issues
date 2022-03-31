import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { FieldError } from 'react-hook-form';
import styled, { css } from 'styled-components';

import { formInputBackgroundColor, formInputErrorColor, textColorPrimary } from '../design/@generated/themes';
import { Popup } from './Popup';

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

const StyledFormInputContainer = styled.div`
    position: relative;
`;

const StyledErrorTrigger = styled.div`
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 100%;
    background-color: ${formInputErrorColor};
    top: 45%;
    left: -2px;
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
    const [popupVisible, setPopupVisibility] = useState(false);
    const [inputFocused, setInputFocus] = useState(false);
    const popupRef = useRef<any>();

    useLayoutEffect(() => {
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
        [props.onFocus, props.error, setPopupVisibility, setInputFocus],
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
        [props.onBlur, props.error, setPopupVisibility, setInputFocus],
    );

    const onClickOutside = useCallback(() => setPopupVisibility(false), [setPopupVisibility]);

    return (
        <StyledFormInputContainer>
            {props.error ? (
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
                        {props.error.message}
                    </Popup>
                </>
            ) : null}
            <StyledFormInput forwardRef={ref} {...props} onFocus={onFocus} onBlur={onBlur} />
        </StyledFormInputContainer>
    );
});
