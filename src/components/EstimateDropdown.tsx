import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import InputMask from 'react-input-mask';

import { EstimateInput } from '../../graphql/@generated/genql';
import { colorPrimary, danger8, danger9, gray6, textColor } from '../design/@generated/themes';
import {
    createLocaleDate,
    quarterFromDate,
    yearFromDate,
    endOfQuarter,
    isPastDate,
    parseLocaleDate,
} from '../utils/dateTime';
import { is } from '../utils/styles';
import { useKeyboard, KeyCode } from '../hooks/useKeyboard';
import { TLocale } from '../types/locale';

import { Button } from './Button';
import { Popup } from './Popup';
import { Icon } from './Icon';
import { Input } from './Input';

interface EstimateDropdownProps {
    text: React.ComponentProps<typeof Button>['text'];
    mask: string;
    locale: TLocale;
    size?: React.ComponentProps<typeof Button>['size'];
    value?: {
        date: string;
        q: string;
        y: string;
    };
    defaultValuePlaceholder: {
        date: string;
        q: string;
        y?: string;
    };
    placeholder?: string;

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

const createValue = (date: string | Date, locale: TLocale) => {
    const localDate = typeof date === 'object' ? date : parseLocaleDate(date, { locale });

    return {
        q: quarterFromDate(localDate),
        y: String(yearFromDate(localDate)),
        date: createLocaleDate(localDate, { locale }),
    };
};

const EstimateDropdown: React.FC<EstimateDropdownProps> = ({
    size = 'm',
    text,
    locale,
    value,
    defaultValuePlaceholder,
    placeholder,
    mask,
    onChange,
    onClose,
}) => {
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);
    const inputVal = parseLocaleDate(value?.date || defaultValuePlaceholder?.date, { locale });
    const [inputState, setInputState] = useState(inputVal ? createLocaleDate(inputVal, { locale }) : '');
    const [selectedQ, setSelectedQ] = useState(value?.q || defaultValuePlaceholder?.q);
    const [changed, setChanged] = useState(false);
    const [buttonText, setButtonText] = useState(text);
    const [nextValue, setNextValue] = useState(value);

    const isPast = nextValue?.date ? isPastDate(parseLocaleDate(nextValue?.date, { locale })) : false;

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

            let newDate = createLocaleDate(endOfQuarter(nextQ), { locale });
            // this is trick to avoid no zero before month in the EN locale, ex: 2/10/1990
            if (newDate.length === 9) {
                newDate = `0${newDate}`;
            }

            setInputState(newDate);
            setChanged(true);
        },
        [locale],
    );

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setChanged(true);
        setInputState(e.target.value);
    }, []);

    const [onESC] = useKeyboard([KeyCode.Escape], () => {
        popupVisible && setPopupVisibility(false);
    });

    useEffect(() => {
        if (isValidDate(inputState)) {
            setSelectedQ(quarterFromDate(parseLocaleDate(inputState, { locale })));
        }
    }, [inputState, locale]);

    useEffect(() => {
        if (changed && isValidDate(inputState)) {
            const v = createValue(inputState, locale);

            v.date === createLocaleDate(endOfQuarter(v.q), { locale })
                ? setButtonText(`${v.q}/${v.y}`)
                : setButtonText(v.date);

            setNextValue(v);
            onChange && onChange(v);
        }
    }, [changed, selectedQ, inputState, locale, onChange]);

    useEffect(() => {
        if (!value) return;

        const newValue = createValue(value.date, locale);

        newValue.date === createLocaleDate(endOfQuarter(newValue.q), { locale })
            ? setButtonText(`${newValue.q}/${yearFromDate(parseLocaleDate(newValue.date, { locale }))}`)
            : setButtonText(newValue.date);

        setNextValue(newValue);
    }, [value, locale]);

    const onCleanClick = useCallback(() => {
        setButtonText(text);
        setChanged(false);
        const inputVal = value?.date || defaultValuePlaceholder?.date;
        setInputState(inputVal ? createLocaleDate(parseLocaleDate(inputVal, { locale }), { locale }) : '');
        setSelectedQ(defaultValuePlaceholder?.q);
        onChange && onChange(undefined);
    }, [defaultValuePlaceholder, text, onChange, setInputState, value?.date, locale]);

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
                        {/* @ts-ignore */}
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
