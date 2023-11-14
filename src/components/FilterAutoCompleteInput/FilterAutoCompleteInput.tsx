import React, { ChangeEvent, useCallback } from 'react';
import styled from 'styled-components';
import { FormControl, FormControlInput } from '@taskany/bricks';
import { IconSearchOutline } from '@taskany/icons';
import { gapS } from '@taskany/colors';

import { tr } from './FilterAutoCompleteInput.i18n';

const StyledInputWrapper = styled.div`
    margin-bottom: ${gapS};
`;

interface FilterAutoCompleteInputProps extends Omit<React.ComponentProps<typeof FormControlInput>, 'onChange'> {
    onChange: (value: string) => void;
}

export const FilterAutoCompleteInput: React.FC<FilterAutoCompleteInputProps> = ({ onChange, ...props }) => {
    const onChangeHandler = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
        },
        [onChange],
    );

    return (
        <StyledInputWrapper>
            <FormControl variant="outline">
                <FormControlInput
                    autoFocus
                    placeholder={tr('Search...')}
                    iconLeft={<IconSearchOutline size="s" />}
                    onChange={onChangeHandler}
                    {...props}
                />
            </FormControl>
        </StyledInputWrapper>
    );
};
