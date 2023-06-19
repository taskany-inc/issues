import { FC, useMemo } from 'react';
import { FiltersDropdown } from '@taskany/bricks';

import { Priority } from '../types/priority';

import { getPriorityText } from './PriorityText/PriorityText';

export const PriorityFilter: FC<{
    text: string;
    value: string[];
    priorities: string[];
    onChange: (value: string[]) => void;
}> = ({ text, value, priorities, onChange }) => {
    const items = useMemo(
        () =>
            priorities.map((p) => ({
                id: p,
                data: getPriorityText(p as Priority),
            })),
        [priorities],
    );

    return <FiltersDropdown text={text} value={value} items={items} onChange={onChange} />;
};
