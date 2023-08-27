import { Input, Dropdown, Button, ArrowUpSmallIcon, ArrowDownSmallIcon, MenuItem, Text } from '@taskany/bricks';
import { useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';

import { createLocaleDate, parseLocaleDate, yearFromDate } from '../utils/dateTime';
import { Estimate, Option } from '../types/estimate';
import { useLocale } from '../hooks/useLocale';

import { EstimateOption } from './EstimateOption';

const StyledTriggerWrapper = styled.div`
    display: flex;
`;

const StyledInput = styled(Input)`
    padding: 2px 8px;
`;

interface EstimateYearProps {
    option: Option;
    value?: Estimate;
    readOnly?: boolean;
    onChange?: (value?: Estimate) => void;
    setReadOnly: Dispatch<
        SetStateAction<{
            year: boolean;
            quarter: boolean;
            date: boolean;
        }>
    >;
}

const currentYear = yearFromDate(new Date());
const years: number[] = [];
for (let i = currentYear + 4; currentYear - 1 <= i; i--) {
    years.push(i);
}

export const EstimateYear: React.FC<EstimateYearProps> = ({ option, value, readOnly, onChange, setReadOnly }) => {
    const locale = useLocale();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const inputRef = useRef(null);

    useEffect(() => {
        if (+selectedYear < years[years.length - 1] || +selectedYear > years[0]) return;

        let estimate = value;
        const yearString = `${selectedYear}`;

        if (estimate) {
            estimate.y = yearString;

            if (estimate.date) {
                estimate.date = createLocaleDate(
                    new Date(parseLocaleDate(estimate.date, { locale }).setFullYear(selectedYear)),
                    {
                        locale,
                    },
                );
            }
        } else {
            estimate = { y: yearString, date: null, q: null };
        }

        onChange?.(estimate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onChange, selectedYear]);

    const onChangeYear = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const numValue = +value;

        if (numValue > years[0] && value.length === 4) {
            setSelectedYear(years[0]);
            return;
        }
        if (numValue < years[years.length - 1] && value.length === 4) {
            setSelectedYear(years[years.length - 1]);
            return;
        }

        setSelectedYear(numValue);
    }, []);

    const onToggleEstimateYear = useCallback((year: number) => {
        setSelectedYear(year);
    }, []);

    const onClick = useCallback(() => {
        const year = value?.y || `${currentYear}`;
        onChange?.({ y: year, q: null, date: null });
        setSelectedYear(+year);
        setReadOnly((prev) => ({ ...prev, date: true, year: false }));
    }, [onChange, setReadOnly, value?.y]);

    return (
        <EstimateOption
            title={option.title}
            clue={option.clue}
            readOnly={readOnly}
            onClick={onClick}
            renderTrigger={() => (
                <StyledTriggerWrapper ref={inputRef}>
                    <StyledInput
                        onChange={onChangeYear}
                        value={selectedYear}
                        brick="right"
                        type="number"
                        view="default"
                        size="s"
                        min={currentYear - 1}
                    />
                    <Dropdown
                        placement="top-end"
                        items={years}
                        offset={[-5, 20]}
                        onChange={onToggleEstimateYear}
                        renderTrigger={(props) => (
                            <Button
                                view="default"
                                brick="left"
                                iconRight={
                                    props.visible ? (
                                        <ArrowUpSmallIcon size="s" noWrap />
                                    ) : (
                                        <ArrowDownSmallIcon size="s" noWrap />
                                    )
                                }
                                ref={props.ref}
                                onClick={props.onClick}
                            />
                        )}
                        renderItem={(props) => (
                            <MenuItem view="primary" key={props.item} ghost onClick={props.onClick}>
                                <Text size="xs">{props.item}</Text>
                            </MenuItem>
                        )}
                    />
                </StyledTriggerWrapper>
            )}
        />
    );
};
