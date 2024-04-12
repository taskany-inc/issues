import React, { useCallback } from 'react';
import { AutoComplete, AutoCompleteInput, AutoCompleteList, nullable } from '@taskany/bricks';

import { tr } from './FilterBase.i18n';

interface FilterBaseProps<T> extends Omit<React.ComponentProps<typeof AutoComplete<T>>, 'onChange'> {
    inputProps?: React.ComponentProps<typeof AutoCompleteInput>;
    viewMode: 'split' | 'union';
    onChange?: (items: string[]) => void;
}

export function FilterBase<T>({ viewMode, onChange, keyGetter, children, ...props }: FilterBaseProps<T>) {
    const handleChange = useCallback(
        (items: T[]) => {
            onChange?.(items.map(keyGetter));
        },
        [onChange, keyGetter],
    );
    return (
        <AutoComplete {...props} keyGetter={keyGetter} onChange={handleChange}>
            {children}
            <AutoCompleteList
                selected={viewMode === 'split'}
                title={viewMode === 'union' ? tr('Suggestions') : undefined}
            />
            {nullable(viewMode === 'split', () => (
                <AutoCompleteList filterSelected title={tr('Suggestions')} />
            ))}
        </AutoComplete>
    );
}
