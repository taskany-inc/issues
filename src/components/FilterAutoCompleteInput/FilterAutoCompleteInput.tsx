import React, { ChangeEvent, ComponentProps, ReactNode, useCallback } from 'react';
import { nullable } from '@taskany/bricks';
import { FormControl, FormControlError, FormControlInput } from '@taskany/bricks/harmony';
import { IconSearchOutline } from '@taskany/icons';

import { tr } from './FilterAutoCompleteInput.i18n';

interface FilterAutoCompleteInputProps extends Omit<React.ComponentProps<typeof FormControlInput>, 'onChange'> {
    onChange: (value: string) => void;
    error?: ComponentProps<typeof FormControlError>['error'];
    icon?: ReactNode;
}

export const FilterAutoCompleteInput: React.FC<FilterAutoCompleteInputProps> = ({
    onChange,
    error,
    icon = <IconSearchOutline size="s" />,
    placeholder = tr('Search...'),
    ...props
}) => {
    const onChangeHandler = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
        },
        [onChange],
    );

    return (
        <FormControl>
            <FormControlInput outline placeholder={placeholder} iconLeft={icon} onChange={onChangeHandler} {...props} />
            {nullable(error?.message, (message) => (
                <FormControlError error={{ message }} />
            ))}
        </FormControl>
    );
};
