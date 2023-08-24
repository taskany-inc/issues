import {
    useClickOutside,
    Input,
    Dropdown,
    Button,
    ArrowUpSmallIcon,
    ArrowDownSmallIcon,
    MenuItem,
    Text,
} from '@taskany/bricks';
import { gapS, gapXs, gray7 } from '@taskany/colors';
import { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { yearFromDate } from '../utils/dateTime';
import { Estimate, Option } from '../types/estimate';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapXs};
`;

const StyledContent = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapS};
    cursor: pointer;
    width: fit-content;
`;

interface EstimateYearProps {
    option: Option;
    value?: Estimate;
    onChange?: (value?: Estimate) => void;
}

const currentYear = yearFromDate(new Date());
const years: number[] = [];
for (let i = currentYear + 4; currentYear - 2 <= i; i--) {
    years.push(i);
}

export const EstimateYear: React.FC<EstimateYearProps> = ({ option, value, onChange }) => {
    const [selectedYear, setSelectedYear] = useState(value?.y || `${currentYear}`);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!value?.y) return;

        setSelectedYear(value.y);
    }, [value?.y]);

    useEffect(() => {
        if (+selectedYear < years[years.length - 1] || +selectedYear > years[0]) return;

        let estimate = value;
        estimate ? (estimate.y = selectedYear) : (estimate = { y: selectedYear, date: null, q: null });
        onChange?.(estimate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onChange, selectedYear]);

    const onChangeYear = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        const numValue = +value;

        if (numValue > years[0] && value.length === 4) {
            setSelectedYear(`${years[0]}`);
            return;
        }
        if (numValue < years[years.length - 1] && value.length === 4) {
            setSelectedYear(`${years[years.length - 1]}`);
            return;
        }

        setSelectedYear(value);
    }, []);

    const onToggleEstimateYear = useCallback((year: number) => {
        setSelectedYear(`${year}`);
    }, []);

    useClickOutside(inputRef, () => {
        if (!value || value?.y === selectedYear) return;

        setSelectedYear(value.y);
    });

    return (
        <StyledWrapper key={option.title}>
            <StyledContent>
                <Text weight="regular" size="s">
                    {option.title}
                </Text>
                <div style={{ display: 'flex' }} ref={inputRef}>
                    <Input
                        onChange={onChangeYear}
                        value={selectedYear}
                        brick={'right'}
                        type={'number'}
                        view="default"
                        size="s"
                        min={currentYear - 2}
                        style={{ padding: '2px 8px' }}
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
                </div>
            </StyledContent>
            <Text weight="regular" size="xxs" color={gray7}>
                {option.clue}
            </Text>
        </StyledWrapper>
    );
};
