import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import InputMask from 'react-input-mask';

import { EstimateInput } from '../../graphql/@generated/genql';
import { colorPrimary, danger8, danger9, gray6, textColor } from '../design/@generated/themes';
import { createLocaleDate, quarterFromDate, yearFromDate, endOfQuarter, isPastDate } from '../utils/dateTime';
import { is } from '../utils/styles';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import { Input } from './Input';

interface EstimateDropdownProps {
    size?: React.ComponentProps<typeof Button>['size'];
    text: React.ComponentProps<typeof Button>['text'];
    value?: {
        date: string;
        q: string;
        y: string;
    };
    defaultValuePlaceholder?: {
        date: string;
        q: string;
        y?: string;
    };
    placeholder?: string;
    mask: string;
    onChange?: (estimate?: EstimateInput) => void;
    onClose?: (estimate?: EstimateInput) => void;
}

const StyledButtonsContainer = styled.div`
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 2;
    grid-gap: 6px;
    margin: 6px 2px;
`;

const StyledCleanButton = styled.div`
    display: none;
    position: absolute;
    z-index: 2;
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

    background-color: ${danger8};
    color: ${textColor};

    &:hover {
        background-color: ${danger9};
        color: ${textColor};
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

const CheckableButton = styled(Button)`
    ${is(
        { checked: true },
        css`
            background-color: ${gray6};
        `,
    )}
`;

const isValidDate = (d: string) => !d.includes('_');

const createValue = (str: string) => ({
    q: quarterFromDate(createLocaleDate(str)),
    y: String(yearFromDate(str)),
    date: str,
});

const EstimateDropdown: React.FC<EstimateDropdownProps> = ({
    size = 'm',
    text,
    onChange,
    onClose,
    value,
    defaultValuePlaceholder,
    placeholder,
    mask,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const [inputState, setInputState] = useState(value?.date || defaultValuePlaceholder?.date || '');
    const [selectedQ, setSelectedQ] = useState(value?.q || defaultValuePlaceholder?.q);
    const [changed, setChanged] = useState(false);
    const [buttonText, setButtonText] = useState(text);
    const [nextValue, setNextValue] = useState(value);

    const isPast = isPastDate(nextValue?.date || '');

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
        if (isPast) return;
        nextValue?.date !== value?.date && onClose && onClose(nextValue);
    }, [onClose, nextValue, value, isPast]);

    const onButtonClick = useCallback(() => {
        setPopupVisibility(true);
    }, []);

    const onQButtonClick = useCallback(
        (nextQ: string) => () => {
            setSelectedQ(nextQ);
            setInputState(endOfQuarter(nextQ, createLocaleDate(inputState)));
            setChanged(true);
        },
        [inputState],
    );

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setChanged(true);
        setInputState(e.target.value);
    }, []);

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        popupVisible && setPopupVisibility(false);
    });

    useEffect(() => {
        setSelectedQ(quarterFromDate(createLocaleDate(inputState)));
    }, [inputState]);

    useEffect(() => {
        if (changed && isValidDate(inputState)) {
            const v = createValue(inputState);

            v.date === endOfQuarter(v.q, createLocaleDate(v.date))
                ? setButtonText(`${v.q}/${v.y}`)
                : setButtonText(v.date);

            setNextValue(v);
            onChange && onChange(v);
        }
    }, [changed, selectedQ, inputState, onChange]);

    useEffect(() => {
        if (!value) return;

        const newValue = createValue(value.date);

        newValue.date === endOfQuarter(newValue.q, createLocaleDate(newValue.date))
            ? setButtonText(`${newValue.q}/${String(yearFromDate(newValue.date))}`)
            : setButtonText(newValue.date);

        setNextValue(newValue);
    }, [value]);

    const onCleanClick = useCallback(() => {
        setButtonText(text);
        setChanged(false);
        setInputState(defaultValuePlaceholder?.date || '');
        setSelectedQ(defaultValuePlaceholder?.q);
        onChange && onChange(undefined);
    }, [defaultValuePlaceholder, text, onChange, setInputState]);

    const renderQButton = (qValue: string) => (
        <CheckableButton
            size="s"
            key={qValue}
            text={qValue}
            checked={qValue === selectedQ}
            onClick={onQButtonClick(qValue)}
        />
    );

    const iconType: React.ComponentProps<typeof Icon>['type'] = changed || value ? 'calendarTick' : 'calendar';
    const iconColor = changed ? colorPrimary : 'inherit';

    return (
        <>
            <StyledDropdownContainer ref={popupRef} {...onESC}>
                {changed && <StyledCleanButton onClick={onCleanClick}>+</StyledCleanButton>}
                <Button
                    ref={buttonRef}
                    size={size}
                    view={isPast ? 'warning' : undefined}
                    text={buttonText}
                    iconLeft={<Icon noWrap type={iconType} size="xs" color={iconColor} />}
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
                <div {...onESC}>
                    <StyledButtonsContainer>{['Q1', 'Q2', 'Q3', 'Q4'].map(renderQButton)}</StyledButtonsContainer>

                    <InputMask mask={mask} maskPlaceholder={null} onChange={onInputChange} value={inputState}>
                        {(props: { value: string; onChange: () => void }) => (
                            <Input autoFocus placeholder={placeholder} value={props.value} onChange={props.onChange} />
                        )}
                    </InputMask>
                </div>
            </Popup>
        </>
    );
};

export default EstimateDropdown;
