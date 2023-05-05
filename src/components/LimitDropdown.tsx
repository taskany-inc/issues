import { FiltersDropdown } from '@taskany/bricks';
import { FC } from 'react';

const items = [10, 20, 30, 50, 100].map((id) => ({
    id: String(id),
    data: String(id),
}));

export const LimitDropdown: FC<{
    text: string;
    value: string[];
    onChange: (value: string[]) => void;
}> = ({ text, value, onChange }) => (
    <FiltersDropdown type="single" text={text} value={value} items={items} onChange={onChange} />
);
