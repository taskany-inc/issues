import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Button } from './Button';
import { Input } from './Input';

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

    return (
        <>
            <StyledContainer>
                {editMode ? (
                    <Input
                        autoFocus
                        placeholder={placeholder}
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
