import React, { useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import InputMask from 'react-input-mask';
import dynamic from 'next/dynamic';

import { EstimateInput } from '../../graphql/@generated/genql';
import { danger8, danger9, gray6, textColor } from '../design/@generated/themes';
import {
    createLocaleDate,
    quarterFromDate,
    yearFromDate,
    endOfQuarter,
    parseLocaleDate,
    formatEstimate,
} from '../utils/dateTime';
import { is } from '../utils/styles';
import { TLocale } from '../types/locale';

import { Button } from './Button';
import { Icon } from './Icon';
import { Input } from './Input';

const ComboBox = dynamic(() => import('./ComboBox'));

interface EstimateComboBoxProps {
    text: React.ComponentProps<typeof Button>['text'];
    mask: string;
    locale: TLocale;
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
    disabled?: boolean;
    placeholder?: string;
    error?: React.ComponentProps<typeof ComboBox>['error'];

    onChange?: (estimate?: EstimateInput) => void;
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

export const EstimateComboBox = React.forwardRef<HTMLDivElement, EstimateComboBoxProps>(
    ({ text, locale, value, defaultValuePlaceholder, placeholder, mask, disabled, error, onChange }, ref) => {
        const inputVal = parseLocaleDate(value?.date || defaultValuePlaceholder?.date, { locale });
        const [inputState, setInputState] = useState(inputVal ? createLocaleDate(inputVal, { locale }) : '');
        const [selectedQ, setSelectedQ] = useState(value?.q || defaultValuePlaceholder?.q);
        const [changed, setChanged] = useState(false);
        const [buttonText, setButtonText] = useState(text);

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

        useEffect(() => {
            if (isValidDate(inputState)) {
                setSelectedQ(quarterFromDate(parseLocaleDate(inputState, { locale })));
            }
        }, [inputState, locale]);

        useEffect(() => {
            if (changed && isValidDate(inputState)) {
                const v = createValue(inputState, locale);
                setButtonText(formatEstimate(v, locale));

                onChange?.(v);
            }
        }, [changed, selectedQ, inputState, locale, onChange]);

        useEffect(() => {
            if (value) {
                setButtonText(formatEstimate(createValue(value.date, locale), locale));
            }
        }, [value, locale]);

        const onCleanClick = useCallback(() => {
            setButtonText(text);
            setChanged(false);
            const inputVal = value?.date || defaultValuePlaceholder?.date;
            setInputState(inputVal ? createLocaleDate(parseLocaleDate(inputVal, { locale }), { locale }) : '');
            setSelectedQ(defaultValuePlaceholder?.q);
            onChange?.(undefined);
        }, [defaultValuePlaceholder, text, onChange, setInputState, value?.date, locale]);

        return (
            <ComboBox
                ref={ref}
                text={text}
                value={value}
                disabled={disabled}
                error={error}
                items={['Q1', 'Q2', 'Q3', 'Q4']}
                maxWidth={100}
                minWidth={100}
                onChange={onChange}
                renderTrigger={(props) => (
                    <StyledTriggerContainer>
                        {changed && <StyledCleanButton onClick={onCleanClick}>+</StyledCleanButton>}
                        <Button
                            ref={props.ref}
                            text={buttonText}
                            iconLeft={<Icon noWrap type="calendarTick" size="xs" />}
                            onClick={props.onClick}
                        />
                    </StyledTriggerContainer>
                )}
                renderInput={() => (
                    <InputMask mask={mask} maskPlaceholder={null} onChange={onInputChange} value={inputState}>
                        {/* @ts-ignore incorrect type in react-input-mask */}
                        {(props: { value: string; onChange: () => void }) => (
                            <StyledInput
                                autoFocus
                                placeholder={placeholder}
                                value={props.value}
                                onChange={props.onChange}
                            />
                        )}
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
                renderItems={(children) => <StyledButtonsContainer>{children}</StyledButtonsContainer>}
            />
        );
    },
);
