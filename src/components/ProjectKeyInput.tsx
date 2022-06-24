import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Button } from './Button';
import { Input } from './Input';
import { Popup } from './Popup';
import { Text } from './Text';

interface ProjectKeyInputProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    tabIndex?: React.ComponentProps<typeof Button>['tabIndex'];
    value: string;
    placeholder?: string;
    available?: boolean;
    tooltip?: React.ReactNode;

    onChange?: (key: string) => void;
    onBlur?: (key: string) => void;
}

const StyledInput = styled(Input)`
    font-weight: 600;
`;

const StyledButton = styled(Button)`
    font-weight: 600;
`;

export const ProjectKeyInput: React.FC<ProjectKeyInputProps> = ({
    size,
    value,
    placeholder,
    tabIndex,
    available,
    tooltip,
    onChange,
    onBlur,
}) => {
    const popupRef = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [inputState, setInputState] = useState(value);

    const [onENTER] = useKeyboard(
        [KeyCode.Enter],
        () => {
            setEditMode(false);
            onBlur && onBlur(inputState);
        },
        {
            stopPropagation: true,
        },
    );

    const [onESC] = useKeyboard(
        [KeyCode.Escape],
        () => {
            popupVisible && setPopupVisibility(false);
            setEditMode(false);
        },
        {
            stopPropagation: true,
        },
    );

    const onInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value.toUpperCase();
            setInputState(newValue);
            onChange && onChange(newValue);
        },
        [setInputState, onChange],
    );

    const onButtonClick = useCallback(() => setEditMode(true), []);
    const onInputBlur = useCallback(() => {
        setEditMode(false);
        onBlur && onBlur(inputState);
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
                        size={size}
                        text={value}
                        tabIndex={tabIndex}
                        view={available === true ? 'primary' : 'danger'}
                        ref={buttonRef}
                        onClick={onButtonClick}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                    />
                )}
            </span>

            <Popup
                placement="left"
                visible={Boolean(tooltip) && popupVisible}
                view={available === true ? 'primary' : 'danger'}
                reference={popupRef}
                interactive
                minWidth={200}
                maxWidth={250}
            >
                <Text size="s">{tooltip}</Text>
            </Popup>
        </>
    );
};
