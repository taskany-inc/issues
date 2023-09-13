import React, { useCallback } from 'react';
import styled from 'styled-components';
import { AutoComplete, AutoCompleteInput, AutoCompleteList, nullable } from '@taskany/bricks';
import { gapS } from '@taskany/colors';

import { tr } from './FilterBase.i18n';

interface FilterBaseProps<T> extends Omit<React.ComponentProps<typeof AutoComplete<T>>, 'onChange'> {
    inputProps?: React.ComponentProps<typeof AutoCompleteInput>;
    viewMode: 'split' | 'union';
    onChange: (items: string[]) => void;
}

const StyledAutoCompleteInput = styled(AutoCompleteInput)`
    margin-bottom: ${gapS};
`;

export function FilterBase<T>({
    inputProps,
    viewMode,
    onChange,
    keyGetter,
    ...props
}: Omit<FilterBaseProps<T>, 'children'>) {
    const handleChange = useCallback(
        (items: T[]) => {
            onChange(items.map(keyGetter));
        },
        [onChange, keyGetter],
    );
    return (
        <AutoComplete {...props} keyGetter={keyGetter} onChange={handleChange}>
            {nullable(inputProps, (input) => (
                <StyledAutoCompleteInput placeholder={tr('Search')} {...input} />
            ))}
            <AutoCompleteList selected={viewMode === 'split'} />
            {nullable(viewMode === 'split', () => (
                <AutoCompleteList filterSelected title={tr('Suggestions')} />
            ))}
        </AutoComplete>
    );
}
