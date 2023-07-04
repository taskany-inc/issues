import { FiltersDropdownBase, MenuItem } from '@taskany/bricks';
import { FC, useMemo } from 'react';

type Tag = {
    id: string;
    title: string;
    description?: string | null;
};

export const TagFilter: FC<{
    text: string;
    value: string[];
    tags: Tag[];
    onChange: (value: string[]) => void;
    onSearchChange: React.ComponentProps<typeof FiltersDropdownBase>['onSearchChange'];
}> = ({ text, value, tags, onChange, onSearchChange }) => {
    const items = useMemo(() => tags.map(({ id, title }) => ({ id, data: title })), [tags]);

    return (
        <FiltersDropdownBase
            text={text}
            value={value}
            items={items}
            onChange={onChange}
            onSearchChange={onSearchChange}
            renderItem={({ item, selected, onClick }) => (
                <MenuItem ghost key={item.id} selected={selected} onClick={onClick}>
                    {item.data}
                </MenuItem>
            )}
        />
    );
};
