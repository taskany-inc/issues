import { Button, useClickOutside } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';
import { useState, useRef, useCallback, Dispatch, SetStateAction, useEffect } from 'react';
import styled from 'styled-components';

import { Option } from '../types/estimate';
import { Quarters, QuartersKeys } from '../types/date';

import { EstimateOption } from './EstimateOption';

const StyledQuarters = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: ${gapXs};
`;

const StyledButton = styled(Button)`
    display: flex;
    justify-content: center;
`;

interface EstimateQuarterProps extends Option {
    value?: QuartersKeys;
    readOnly?: boolean;
    onChange?: (value?: QuartersKeys) => void;
    setReadOnly: Dispatch<
        SetStateAction<{
            year: boolean;
            quarter: boolean;
            date: boolean;
        }>
    >;
}

const quartersList = Object.values(Quarters);

export const EstimateQuarter: React.FC<EstimateQuarterProps> = ({
    title,
    clue,
    value = null,
    readOnly,
    onChange,
    setReadOnly,
}) => {
    const [selectedQuarter, setSelectedQuarter] = useState<QuartersKeys | null>(value);
    const ref = useRef(null);

    useClickOutside(ref, () => {
        if (selectedQuarter) return;

        setReadOnly((prev) => ({ ...prev, quarter: true, date: true }));
        setSelectedQuarter(null);
    });

    const onToggleQuarter = useCallback(
        (quarter: QuartersKeys) => () => {
            setSelectedQuarter((prev) => (prev === quarter ? null : quarter));
        },
        [],
    );

    const onClick = useCallback(() => {
        setReadOnly({
            quarter: false,
            year: false,
            date: true,
        });

        setSelectedQuarter(value);
    }, [setReadOnly, value]);

    useEffect(() => {
        if (!readOnly && value !== selectedQuarter) {
            onChange?.(selectedQuarter || undefined);
        }
    }, [readOnly, onChange, selectedQuarter, value]);

    return (
        <EstimateOption
            title={title}
            clue={clue}
            readOnly={readOnly}
            onClick={onClick}
            renderTrigger={() => (
                <StyledQuarters ref={ref}>
                    {quartersList.map((quarter) => {
                        return (
                            <StyledButton
                                key={quarter}
                                size="s"
                                text={quarter}
                                checked={selectedQuarter === quarter}
                                onClick={onToggleQuarter(quarter)}
                            />
                        );
                    })}
                </StyledQuarters>
            )}
        />
    );
};
