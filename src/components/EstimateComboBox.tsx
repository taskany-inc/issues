import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import InputMask from 'react-input-mask';
import { danger8, danger9, gray6, textColor } from '@taskany/colors';
import { Button, Input, ComboBox } from '@taskany/bricks';
import { IconCalendarTickOutline } from '@taskany/icons';

import {
    createLocaleDate,
    endOfQuarter,
    parseLocaleDate,
    formatEstimate,
    quarters,
    createValue,
    incYearIfDateHasPassed,
    isPastDate,
} from '../utils/dateTime';
import { useLocale } from '../hooks/useLocale';
import { TLocale } from '../utils/getLang';

interface EstimateComboBoxProps {
    text?: React.ComponentProps<typeof Button>['text'];
    mask: string;
    value?: {
        date: string;
        q: string;
        y: string;
        id: number;
    };
    defaultValuePlaceholder: {
        date: string;
        q: string;
        y?: string;
    };
    disabled?: boolean;
    placeholder?: string;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (estimate?: { date?: string; q?: string; y: string }) => void;
}

const StyledInput = styled(Input)`
    min-width: 100px;
`;

const StyledButtonsContainer = styled.div`
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 2;
    grid-gap: 6px;
    margin: 6px 2px;
`;
const StyledItemsYearContainer = styled.div`
    display: flex;
    margin: 0px 2px;
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

const StyledTriggerContainer = styled.div`
    position: relative;

    &:hover {
        ${StyledCleanButton} {
            display: block;
        }
    }
`;

const CheckableButton = styled(Button)<{ checked?: boolean }>`
    ${({ checked }) =>
        checked &&
        `
            background-color: ${gray6};
        `}
`;

const isFullDate = (str: string) => !str.includes('_');

const getDate = (val: string, locale: TLocale) =>
    val ? createLocaleDate(parseLocaleDate(val, { locale }), { locale }) : '';

export const EstimateComboBox = React.forwardRef<HTMLDivElement, EstimateComboBoxProps>(
    ({ text = '', value, defaultValuePlaceholder, placeholder, mask, disabled, error, onChange }, ref) => {
        const locale = useLocale();
        const inputVal = parseLocaleDate(value?.date || defaultValuePlaceholder?.date, { locale });
        const [inputState, setInputState] = useState(inputVal ? createLocaleDate(inputVal, { locale }) : '');
        const [selectedQ, setSelectedQ] = useState(value?.q || defaultValuePlaceholder?.q || undefined);
        const [changed, setChanged] = useState(false);
        const [buttonText, setButtonText] = useState(text);
        const [currentYear, setCurrentYear] = useState(inputVal.getFullYear().toString());

        const quarterInfo = useMemo(() => {
            const result: Record<string, { date: string; q: string; y: string }> = {};
            const map = new Map(Object.entries(quarters));

            map.forEach((quarter) => {
                const curYearEndOfQuarter = incYearIfDateHasPassed(endOfQuarter(quarter));

                result[quarter] = createValue(createLocaleDate(curYearEndOfQuarter, { locale }), locale);
            });

            return result;
        }, [locale]);

        const handlerOnKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            e.preventDefault();
        }, []);

        useEffect(() => {
            if (!value) return;
            const date = getDate(value?.date, locale);
            setInputState(date);
            setSelectedQ(value?.q);
        }, [locale, value]);

        useEffect(() => {
            if (!changed) return;
            setButtonText(value?.date ? formatEstimate(value, locale) : currentYear);
        }, [changed, currentYear, locale, value]);

        const onQButtonClick = useCallback(
            (nextQ?: string) => () => {
                setChanged(true);

                if (nextQ) {
                    const quarter = quarterInfo[nextQ];
                    onChange?.(quarter);
                    return;
                }

                onChange?.({ date: undefined, q: undefined, y: currentYear });
                setInputState('');
            },
            [currentYear, onChange, quarterInfo],
        );

        const onInputYearChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                setChanged(true);
                setCurrentYear(e.target.value);
                onChange?.({ date: undefined, q: undefined, y: e.target.value });
            },
            [onChange],
        );

        const onInputChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const inputValue = e.target.value;
                setInputState(inputValue);
                setChanged(true);

                if (!isFullDate(inputValue)) return;
                if (!isPastDate(parseLocaleDate(inputValue, { locale }))) {
                    onChange?.(createValue(inputValue, locale));
                } else {
                    if (!value) return;
                    onChange?.(value);
                }
            },
            [locale, onChange, value],
        );

        const onCleanClick = useCallback(() => {
            onChange?.();
            setChanged(false);
            setButtonText(text);
        }, [onChange, text]);

        const onClickOutside = useCallback((cb: () => void) => cb(), []);

        return (
            <ComboBox
                ref={ref}
                text={text}
                value={value}
                disabled={disabled}
                error={error}
                placement="top-start"
                items={Object.keys(quarterInfo)}
                maxWidth={100}
                minWidth={100}
                onClickOutside={onClickOutside}
                onChange={onChange}
                renderTrigger={(props) => (
                    <StyledTriggerContainer>
                        {changed && <StyledCleanButton onClick={onCleanClick}>+</StyledCleanButton>}
                        <Button
                            disabled={props.disabled}
                            text={buttonText}
                            iconLeft={<IconCalendarTickOutline noWrap size="xs" />}
                            onClick={props.onClick}
                        />
                    </StyledTriggerContainer>
                )}
                renderInput={({ ref }) => (
                    <InputMask mask={mask} maskPlaceholder={null} onChange={onInputChange} value={inputState}>
                        {/* @ts-ignore incorrect type in react-input-mask */}
                        {(props) => <StyledInput placeholder={placeholder} ref={ref} {...props} />}
                    </InputMask>
                )}
                renderItem={(props) => (
                    <CheckableButton
                        size="s"
                        key={props.item}
                        text={props.item}
                        checked={props.item === selectedQ}
                        onClick={onQButtonClick(props.item)}
                    />
                )}
                renderItems={(children) => (
                    <>
                        <StyledButtonsContainer>{children as React.ReactNode}</StyledButtonsContainer>
                        <StyledItemsYearContainer>
                            <Input
                                onChange={onInputYearChange}
                                value={currentYear}
                                brick={'right'}
                                type={'number'}
                                min={quarterInfo[defaultValuePlaceholder.q].y}
                                onKeyDown={handlerOnKeyDown}
                            />
                            <CheckableButton
                                text={'Y'}
                                checked={!selectedQ}
                                brick="left"
                                size={'s'}
                                onClick={onQButtonClick()}
                            />
                        </StyledItemsYearContainer>
                    </>
                )}
            />
        );
    },
);
