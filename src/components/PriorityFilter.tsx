import { FC, useMemo } from 'react';

import { Priority, priorityColorsMap } from '../types/priority';

import { ColorizedFilterDropdown } from './ColorizedFilterDropdown';
import { getPriorityText } from './PriorityText/PriorityText';

export const PriorityFilter: FC<{
    text: string;
    value: string[];
    priorities: string[];
    onChange: (value: Priority[]) => void;
}> = ({ text, value, priorities, onChange }) => {
    const items = useMemo(
        () =>
            priorities.map((priority) => ({
                id: priority,
                data: {
                    text: getPriorityText(priority as Priority),
                    hue: priorityColorsMap[priority as Priority],
                },
            })),
        [priorities],
    );

    return (
        <ColorizedFilterDropdown
            text={text}
            items={items}
            value={value}
            onChange={onChange as (value: string[]) => void}
        />
    );
};
