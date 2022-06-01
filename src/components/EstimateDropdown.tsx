import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Input, useInput, useKeyboard, KeyCode } from '@geist-ui/core';
import InputMask from 'react-input-mask';

import { GoalEstimate } from '../../graphql/@generated/genql';
import {
    buttonDangerBackgroundColor,
    buttonDangerBackgroundColorHover,
    buttonDangerOutlineTextColorHover,
    buttonDangerTextColor,
    buttonIconColor,
    secondaryTaskanyLogoColor,
} from '../design/@generated/themes';
import { createLocaleDate, quarterFromDate, yearFromDate, endOfQuarter } from '../utils/dateTime';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';

interface EstimateDropdownProps {
    size?: React.ComponentProps<typeof Button>['size'];
    view?: React.ComponentProps<typeof Button>['view'];
    text: React.ComponentProps<typeof Button>['text'];
    value?: {
        date: string;
        q: string;
    };
    defaultValuePlaceholder?: {
        date: string;
        q: string;
    };
    placeholder?: string;
    mask: string;
    onChange?: (estimate?: GoalEstimate) => void;
}

const StyledButtonsContainer = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 2;
    grid-gap: 6px;
    margin: 6px;
`;

const StyledCleanButton = styled.div`
    display: none;
    position: absolute;
    transform: rotate(45deg);
    top: -6px;
    right: -6px;
    width: 12px;
    height: 12px;
    line-height: 12px;
    text-align: center;
    font-size: 12px;
    border-radius: 100%;
    cursor: pointer;
    background-color: ${buttonDangerBackgroundColor};
    color: ${buttonDangerTextColor};
    pointer-events: none;

    &:hover {
        background-color: ${buttonDangerBackgroundColorHover};
        color: ${buttonDangerOutlineTextColorHover};
    }
`;

const StyledDropdownContainer = styled.div`
    position: relative;

    &:hover {
        ${StyledCleanButton} {
            display: block;
        }
    }
`;

const isValidDate = (d: string) => !d.includes('_');

export const EstimateDropdown: React.FC<EstimateDropdownProps> = ({
    size,
    text,
    view,
    onChange,
    value,
    defaultValuePlaceholder,
    placeholder,
    mask,
}) => {
    const popupRef = useRef<any>();
    const buttonRef = useRef<any>();
    const [popupVisible, setPopupVisibility] = useState(false);
    const {
        state: inputState,
        setState: setInputState,
        bindings: onInput,
    } = useInput(defaultValuePlaceholder?.date || '');
    const [selectedQ, setSelectedQ] = useState(defaultValuePlaceholder?.q);
    const [changed, setChanged] = useState(false);
    const [buttonText, setButtonText] = useState(text);

    const getValue = () => ({
        q: quarterFromDate(createLocaleDate(inputState)),
        y: String(yearFromDate(inputState)),
        date: inputState,
    });

    const onClickOutside = () => {
        setPopupVisibility(false);
    };

    const onButtonClick = () => {
        setPopupVisibility(true);
    };

    const onQButtonClick = (nextQ: string) => () => {
        setSelectedQ(nextQ);
        setInputState(endOfQuarter(nextQ, createLocaleDate(inputState)));
        setChanged(true);
    };

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setChanged(true);
        onInput.onChange(e);
    };

    const { bindings: onESC } = useKeyboard(
        () => {
            popupVisible && setPopupVisibility(false);
        },
        [KeyCode.Escape],
        {
            stopPropagation: true,
        },
    );

    useEffect(() => {
        setSelectedQ(quarterFromDate(createLocaleDate(inputState)));
    }, [inputState]);

    useEffect(() => {
        if (changed && isValidDate(inputState) && !value) {
            const v = getValue();

            if (v.date === endOfQuarter(v.q, createLocaleDate(v.date))) {
                setButtonText(`${v.q}/${v.y}`);
            } else {
                setButtonText(v.date);
            }

            onChange && onChange(v);
        }

        if (value) {
            const newValue = {
                q: quarterFromDate(createLocaleDate(value.date)),
                y: String(yearFromDate(value.date)),
                date: value.date,
            };

            if (newValue.date === endOfQuarter(newValue.q, createLocaleDate(newValue.date))) {
                setButtonText(`${newValue.q}/${String(yearFromDate(newValue.date))}`);
            } else {
                setButtonText(newValue.date);
            }
        }
    }, [changed, selectedQ, inputState, value]);

    const onCleanClick = () => {
        setButtonText(text);
        setChanged(false);
        setInputState(defaultValuePlaceholder?.date || '');
        setSelectedQ(defaultValuePlaceholder?.q);
        onChange && onChange(undefined);
    };

    const renderQButton = (qValue: string) => (
        <Button
            ghost
            size="s"
            key={qValue}
            view={view}
            text={qValue}
            checked={qValue === selectedQ}
            onClick={onQButtonClick(qValue)}
        />
    );

    const iconType: React.ComponentProps<typeof Icon>['type'] = changed ? 'calendarTick' : 'calendar';
    const iconColor = changed ? secondaryTaskanyLogoColor : buttonIconColor;

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                {changed && <StyledCleanButton onClick={onCleanClick}>+</StyledCleanButton>}
                <Button
                    ref={buttonRef}
                    size={size}
                    view={view}
                    text={buttonText}
                    iconLeft={<Icon type={iconType} size="xs" color={iconColor} />}
                    onClick={onButtonClick}
                />
            </StyledDropdownContainer>

            <Popup
                placement="top-start"
                overflow="hidden"
                visible={popupVisible}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={100}
                maxWidth={100}
                offset={[0, 4]}
            >
                <>
                    <StyledButtonsContainer>{['Q1', 'Q2', 'Q3', 'Q4'].map(renderQButton)}</StyledButtonsContainer>

                    <InputMask mask={mask} maskPlaceholder={null} {...{ ...onInput, onChange: onInputChange }}>
                        {(props: any) => (
                            <Input
                                placeholder={placeholder}
                                scale={0.78}
                                width="100%"
                                autoFocus
                                value={props.value}
                                onChange={props.onChange}
                            />
                        )}
                    </InputMask>
                </>
            </Popup>
        </>
    );
};
