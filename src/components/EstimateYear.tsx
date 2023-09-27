import { Input, Dropdown, Button, MenuItem, Text } from '@taskany/bricks';
import { useState, useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { IconUpSmallSolid, IconDownSmallSolid } from '@taskany/icons';
import styled from 'styled-components';

import { getYearFromDate } from '../utils/dateTime';
import { Option } from '../types/estimate';

import { EstimateOption } from './EstimateOption';

const StyledTriggerWrapper = styled.div`
    display: flex;
`;

const StyledInput = styled(Input)`
    padding: 2px 8px;
`;

interface EstimateYearProps {
    option: Option;
    value?: number;
    readOnly?: boolean;
    onChange?: (value?: number) => void;
    setReadOnly: Dispatch<
        SetStateAction<{
            year: boolean;
            quarter: boolean;
            date: boolean;
        }>
    >;
}

const currentYear = getYearFromDate(new Date());
const years: number[] = [];
for (let i = currentYear + 4; currentYear - 1 <= i; i--) {
    years.push(i);
}

const getValidYear = (year: number): number => {
    if (year > years[0]) {
        return years[0];
    }
    if (year < years[years.length - 1]) {
        return years[years.length - 1];
    }

    return year;
};

export const EstimateYear: React.FC<EstimateYearProps> = ({ option, value, readOnly, onChange, setReadOnly }) => {
    const yearValue = value ? getValidYear(value) : null;
    const [selectedYear, setSelectedYear] = useState(yearValue || currentYear);
    const inputRef = useRef(null);

    const onChangeYear = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;

            if (value.length === 4) {
                setSelectedYear?.(getValidYear(+value));
            }
        },
        [setSelectedYear],
    );

    const onToggleEstimateYear = useCallback(
        (year: number) => {
            setSelectedYear?.(year);
        },
        [setSelectedYear],
    );

    const onClick = useCallback(() => {
        setReadOnly((prev) => ({ ...prev, date: true, year: false }));
        onChange?.(selectedYear);
    }, [setReadOnly, selectedYear, onChange]);

    useEffect(() => {
        if (!readOnly && selectedYear !== yearValue) {
            onChange?.(selectedYear);
        }
    }, [readOnly, selectedYear, yearValue, onChange]);

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
                                    props.visible ? <IconUpSmallSolid size="s" /> : <IconDownSmallSolid size="s" />
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
