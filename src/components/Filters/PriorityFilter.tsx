import React, { FC, useMemo } from 'react';
import { FiltersPanelDropdown, useSerializedDropdownItems } from '@taskany/bricks';

import { Priority, priorityColorsMap } from '../../types/priority';
import { getPriorityText } from '../PriorityText/PriorityText';
import { ColorizedMenuItem } from '../ColorizedMenuItem';

type PriorityFilterProps = {
    priority: Priority[];
    title: string;
    id: string;
};

const getDescriptor = (id: Priority) => ({ id, name: getPriorityText(id) });

export const PriorityFilter = React.forwardRef<HTMLDivElement, PriorityFilterProps>(({ id, title, priority }, ref) => {
    const { ids, getValueDescriptor } = useSerializedDropdownItems(priority, getDescriptor);

    return (
        <FiltersPanelDropdown
            ref={ref}
            id={id}
            title={title}
            items={ids}
            getValueDescriptor={getValueDescriptor}
            renderItem={(props) => (
                <ColorizedMenuItem
                    key={props.item.id}
                    hue={priorityColorsMap[props.item.id as Priority]}
                    checked={props.selected}
                    onClick={props.onClick}
                >
                    {props.item.name}
                </ColorizedMenuItem>
            )}
        />
    );
});
