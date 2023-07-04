import { FC } from 'react';
import { FiltersDropdown } from '@taskany/bricks';

import { Priority, priorityVariants } from '../types/priority';

import { getPriorityText } from './PriorityText/PriorityText';

const priorities = Object.keys(priorityVariants).map((p) => ({
    id: p,
    data: getPriorityText(p as Priority),
}));

export const PriorityFilter: FC<{
    text: string;
    value: string[];
    onChange: (value: string[]) => void;
}> = ({ text, value, onChange }) => {
    return <FiltersDropdown text={text} value={value} items={priorities} onChange={onChange} />;
};
