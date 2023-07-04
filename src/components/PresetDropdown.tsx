import { FiltersDropdown } from '@taskany/bricks';
import { FC, useCallback, useMemo } from 'react';
import { Filter } from '@prisma/client';

import { FilterById } from '../../trpc/inferredTypes';

const showSearchItemLength = 5;

export const PresetDropdown: FC<{
    text: string;
    value?: FilterById;
    presets: Filter[];
    onChange: (id: string) => void;
}> = ({ text, value, presets, onChange }) => {
    const presetValue = useMemo(() => (value ? [value.id] : []), [value]);
    const items = useMemo(() => presets.map(({ id, title }) => ({ id, data: title })), [presets]);

    const presetChangeHandler = useCallback(
        ([value]: string[]) => {
            onChange(value);
        },
        [onChange],
    );

    return (
        <FiltersDropdown
            search={items.length > showSearchItemLength}
            text={text}
            type="single"
            value={presetValue}
            items={items}
            onChange={presetChangeHandler}
        />
    );
};
