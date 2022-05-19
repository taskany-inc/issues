import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { Input, useInput, useKeyboard, KeyCode } from '@geist-ui/core';

import { Button } from './Button';

interface ProjectKeyInputProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    value: string;
    placeholder?: string;
    onChange?: (key: string) => void;
    onBlur?: (key: string) => void;
}

const StyledContainer = styled.div``;

export const ProjectKeyInput: React.FC<ProjectKeyInputProps> = ({
    size,
    value,
    view,
    onChange,
    onBlur,
    placeholder,
}) => {
    const [editMode, setEditMode] = useState(false);
    const { state: inputState, setState: setInputState } = useInput(value);

    const { bindings: onENTER } = useKeyboard(
        () => {
            setEditMode(false);
            onBlur && onBlur(inputState);
        },
        [KeyCode.Enter],
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

    const onButtonClick = () => setEditMode(true);
    const onInputBlur = () => {
        setEditMode(false);
        onBlur && onBlur(inputState);
    };

    return (
        <>
            <StyledContainer>
                {editMode ? (
                    <Input
                        placeholder={placeholder}
                        scale={0.78}
                        autoFocus
                        value={value}
                        onChange={onInputChange}
                        onBlur={onInputBlur}
                        {...onENTER}
                    />
                ) : (
                    <Button ghost size={size} view={view} text={value} onClick={onButtonClick} />
                )}
            </StyledContainer>
        </>
    );
};
