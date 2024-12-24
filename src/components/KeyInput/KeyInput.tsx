import React, { useCallback, useRef, useState } from 'react';
import { KeyCode, useKeyboard } from '@taskany/bricks';
import { FormControl, FormControlInput, Button, Tooltip } from '@taskany/bricks/harmony';

import { keyPredictor } from '../../utils/keyPredictor';
import {
    projectKeyPredictor,
    projectKeyPredictorError,
    projectKeyPredictorHint,
    projectKeyPredictorInput,
} from '../../utils/domObjects';

import s from './KeyInput.module.css';

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
            const newValue = keyPredictor(e.target.value, { allowVowels: true });
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
                    <FormControl>
                        <FormControlInput
                            autoFocus
                            disabled={disabled}
                            placeholder={placeholder}
                            value={value}
                            onChange={onInputChange}
                            onBlur={onInputBlur}
                            tabIndex={tabIndex}
                            outline
                            {...onENTER}
                            {...projectKeyPredictorInput.attr}
                        />
                    </FormControl>
                ) : (
                    <Button
                        disabled={disabled}
                        size={size}
                        text={value}
                        tabIndex={tabIndex}
                        brick="left"
                        view={available === true && !error ? 'primary' : 'danger'}
                        ref={buttonRef}
                        onClick={onButtonClick}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        className={s.KeyInputButton}
                        {...projectKeyPredictor.attr}
                    />
                )}
            </span>

            <Tooltip
                arrow
                offset={[0, 8]}
                minWidth={200}
                maxWidth={250}
                placement="left"
                visible={(Boolean(tooltip) || error) && popupVisible}
                reference={popupRef}
                view={available === true && !error ? 'success' : 'danger'}
                {...(available === true && !error ? projectKeyPredictorHint.attr : projectKeyPredictorError.attr)}
            >
                {error?.message || tooltip}
            </Tooltip>
        </>
    );
};

export default KeyInput;
