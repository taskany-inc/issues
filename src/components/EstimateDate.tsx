import { Input, Text, useClickOutside } from '@taskany/bricks';
import { danger8, danger9, gapS, gray9, textColor } from '@taskany/colors';
import { IconPlusCircleSolid } from '@taskany/icons';
import { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import InputMask from 'react-input-mask';

import { useLocale } from '../hooks/useLocale';
import { currentLocaleDate, createValue, parseLocaleDate, createLocaleDate } from '../utils/dateTime';
import { Option, Estimate } from '../types/estimate';

const StyledWrapper = styled.div<{ readOnly: boolean }>`
    display: flex;
    align-items: ${({ readOnly }) => (readOnly ? 'end' : 'center')};
    gap: ${gapS};
    width: fit-content;
    position: relative;
`;

const StyledText = styled(Text)`
    white-space: nowrap;
`;

const StyledRemoveButton = styled.div`
    border-radius: 100%;
    background: red;
    height: 12px;
    width: 12px;
    min-width: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transform: rotate(45deg);
    cursor: pointer;
    position: absolute;
    right: -4px;
    top: -4px;
    background-color: ${danger8};
    color: ${textColor};
    transition: background-color 200ms ease;

    &:hover {
        background-color: ${danger9};
        color: ${textColor};
    }
`;

interface EstimateDateProps {
    option: Omit<Option, 'clue'>;
    mask: string;
    placeholder: string;
    value?: Estimate;
    onChange?: (value?: Estimate) => void;
}

export const EstimateDate: React.FC<EstimateDateProps> = ({ option, mask, placeholder, onChange, value }) => {
    const locale = useLocale();
    const currentDate = currentLocaleDate({ locale });
    const [readOnly, setReadOnly] = useState(true);
    const [fullDate, setFullDate] = useState(currentDate);
    const ref = useRef(null);

    useClickOutside(ref, () => {
        if (!fullDate.includes('_')) return;

        setFullDate(currentDate);
        setReadOnly(true);
        value ? (value.date = null) : undefined;
        onChange?.(value);
    });

    useEffect(() => {
        if (fullDate.includes('_') || fullDate === currentDate) return;

        const values = createValue(fullDate, locale);
        onChange?.(values);
    }, [currentDate, fullDate, locale, onChange]);

    const onCreateEstimate = useCallback(
        (date: string | Date) => {
            date = parseLocaleDate(date, { locale });
            value?.y && date.setFullYear(+value.y);

            return createValue(date, locale);
        },
        [locale, value?.y],
    );

    useEffect(() => {
        if (readOnly) return;

        const estimate = onCreateEstimate(value?.date || currentDate);

        onChange?.(estimate);
        setFullDate(estimate.date);
    }, [readOnly, currentDate, onCreateEstimate, onChange, value?.date]);

    const onChangeDate = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;

            if (value.includes('_')) {
                setFullDate(value);
                return;
            }

            const date = parseLocaleDate(value, { locale });

            if (Number.isNaN(new Date(date).getTime())) {
                setFullDate(currentDate);
                return;
            }

            setFullDate(createLocaleDate(date, { locale }));
        },
        [currentDate, locale],
    );

    const onRemoveDate = useCallback(() => {
        if (!value) return;

        value.date = null;
        value.q = null;

        setReadOnly(true);
        setFullDate(currentDate);
        onChange?.(value);
    }, [currentDate, onChange, value]);

    const onClickIcon = useCallback(() => {
        const estimate = onCreateEstimate(value?.date || currentDate);

        setReadOnly(false);
        setFullDate(estimate.date);
        onChange?.(estimate);
    }, [currentDate, onCreateEstimate, onChange, value?.date]);

    return (
        <StyledWrapper readOnly={readOnly} key={option.title}>
            <StyledText weight="regular" size="s">
                {option.title}
            </StyledText>
            {readOnly ? (
                <IconPlusCircleSolid size="xs" color={gray9} onClick={onClickIcon} style={{ cursor: 'pointer' }} />
            ) : (
                <>
                    <InputMask mask={mask} placeholder={placeholder} onChange={onChangeDate} value={fullDate}>
                        {/* @ts-ignore incorrect type in react-input-mask */}
                        {(props) => <Input ref={ref} {...props} />}
                    </InputMask>
                    <StyledRemoveButton onClick={onRemoveDate}>+</StyledRemoveButton>
                </>
            )}
        </StyledWrapper>
    );
};
