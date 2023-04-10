import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';
import { Button } from '@taskany/bricks';

import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { keyPredictor } from '../utils/keyPredictor';

import { Input } from './Input';
import { Text } from './Text';

const Popup = dynamic(() => import('./Popup'));

interface KeyInputProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    tabIndex?: React.ComponentProps<typeof Button>['tabIndex'];
    value: string;
    placeholder?: string;
    available?: boolean;
    tooltip?: React.ReactNode;
    disabled?: boolean;
    error?: {
        message?: string;
    };

    onChange?: (key: string) => void;
    onDirty?: () => void;
    onBlur?: (key: string) => void;
}

const StyledInput = styled(Input)`
    font-weight: 600;
`;

const StyledButton = styled(Button)`
    font-weight: 600;
`;

const KeyInput: React.FC<KeyInputProps> = ({
    size,
    value,
    placeholder,
    tabIndex,
    available = true,
    tooltip,
    disabled,
    error,
    onChange,
    onDirty,
    onBlur,
}) => {
    const popupRef = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [inputState, setInputState] = useState(value);

    const [onENTER] = useKeyboard([KeyCode.Enter], () => {
        setEditMode(false);

        onBlur?.(inputState);
    });

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        popupVisible && setPopupVisibility(false);
        setEditMode(false);
    });

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = keyPredictor(e.target.value);
            setInputState(newValue);

            onDirty?.();

            onChange?.(newValue);
        },
        [setInputState, onChange, onDirty],
    );

    const onButtonClick = useCallback(() => setEditMode(true), []);
    const onInputBlur = useCallback(() => {
        setEditMode(false);

        onBlur?.(inputState);
    }, [onBlur, inputState]);

    const onMouseEnter = useCallback(() => {
        setPopupVisibility(true);
    }, []);

    const onMouseLeave = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    return (
        <>
            <span ref={popupRef} {...onESC}>
                {editMode ? (
                    <StyledInput
                        autoFocus
                        disabled={disabled}
                        placeholder={placeholder}
                        value={value}
                        onChange={onInputChange}
                        onBlur={onInputBlur}
                        tabIndex={tabIndex}
                        {...onENTER}
                    />
                ) : (
                    <StyledButton
                        outline
                        disabled={disabled}
                        size={size}
                        text={value}
                        tabIndex={tabIndex}
                        view={available === true && !error ? 'primary' : 'danger'}
                        ref={buttonRef}
                        onClick={onButtonClick}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                )}
            </span>

            <Popup
                placement="left"
                visible={(Boolean(tooltip) || error) && popupVisible}
                view={available === true && !error ? 'primary' : 'danger'}
                reference={popupRef}
                interactive
                minWidth={200}
                maxWidth={250}
            >
                <Text size="s">{error?.message || tooltip}</Text>
            </Popup>
        </>
    );
};

export default KeyInput;
