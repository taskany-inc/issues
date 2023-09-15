import { FiltersDropdown } from '@taskany/bricks';
import { FC, useCallback } from 'react';

const items = [10, 20, 30, 50, 100].map((id) => ({
    id: String(id),
    data: String(id),
}));

export const LimitDropdown: FC<{
    text: string;
    value: string[];
    onChange: (value: number) => void;
}> = ({ text, value, onChange }) => {
    const handleChange = useCallback(
        ([item]: string[]) => {
            if (!Number.isNaN(+item)) {
                onChange(+item);
            }
        },
        [onChange],
    );

    return <FiltersDropdown type="single" text={text} value={value} items={items} onChange={handleChange} />;
};
