import React from 'react';
import { FiltersPanelDropdown, useSerializedDropdownItems } from '@taskany/bricks';

import { State } from '../../../graphql/@generated/genql';
import { ColorizedMenuItem } from '../ColorizedMenuItem';

type PriorityFilterProps = {
    states: State[];
    title: string;
    id: string;
};

const getDescriptor = (state: State) => ({ id: state.id, name: state.title, item: state });

export const StateFilter = React.forwardRef<HTMLDivElement, PriorityFilterProps>(({ id, title, states }, ref) => {
    const { ids, getValueDescriptor } = useSerializedDropdownItems(states, getDescriptor);

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
                    hue={props.item.item.hue}
                    checked={props.selected}
                    onClick={props.onClick}
                >
                    {props.item.name}
                </ColorizedMenuItem>
            )}
        />
    );
});
