import React from 'react';
import styled from 'styled-components';
import { AutoCompleteInput } from '@taskany/bricks';
import { IconSearchOutline } from '@taskany/icons';
import { gapS } from '@taskany/colors';

import { tr } from './FilterAutoCompleteInput.i18n';

const StyledInputWrapper = styled.div`
    margin-bottom: ${gapS};
`;

const StyledAutoCompleteInput = styled(AutoCompleteInput)`
    display: inline-block;
`;

interface FilterAutoCompleteInputProps extends React.ComponentProps<typeof AutoCompleteInput> {
    placeholder?: never;
    iconLeft?: never;
}

export const FilterAutoCompleteInput: React.FC<FilterAutoCompleteInputProps> = (props) => {
    return (
        <StyledInputWrapper>
            <StyledAutoCompleteInput
                placeholder={tr('Search...')}
                iconLeft={<IconSearchOutline size="s" />}
                {...props}
            />
        </StyledInputWrapper>
    );
};
