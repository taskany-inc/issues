import { FC } from 'react';
import { FilterDropdownItem, FiltersDropdownBase, FiltersDropdownItemProps } from '@taskany/bricks';

import { ColorizedMenuItem } from './ColorizedMenuItem';

interface ColorizedFilterItem {
    color: string;
    hoverBackground: string;
    text: string;
}

export const ColorizedFilterDropdown: FC<{
    items: Array<FilterDropdownItem<ColorizedFilterItem>>;
    text: string;
    value: string[];
    onChange: React.ComponentProps<typeof FiltersDropdownBase>['onChange'];
}> = ({ text, items, value, onChange }) => (
    <FiltersDropdownBase
        text={text}
        items={items}
        value={value}
        onChange={onChange}
        renderItem={({ item: { id, data }, selected, onClick }: FiltersDropdownItemProps<ColorizedFilterItem>) => (
            <ColorizedMenuItem
                key={id}
                color={data.color}
                hoverBackground={data.hoverBackground}
                checked={selected}
                onClick={onClick}
            >
                {data.text}
            </ColorizedMenuItem>
        )}
    />
);
