import { FC, useMemo } from 'react';
import { Tab } from '@taskany/bricks';

import { Priority as PriorityName, priorityVariants } from '../types/priority';

import { getPriorityText } from './PriorityText/PriorityText';
import { FilterCheckbox } from './FilterCheckbox';
import { FilterBase } from './FilterBase/FilterBase';
import { FilterTabLabel } from './FilterTabLabel';

type Variant = keyof typeof priorityVariants;

type Priority = {
    id: Variant;
    data: string;
};

const priorities: Priority[] = (Object.keys(priorityVariants) as Variant[]).map((p) => ({
    id: p,
    data: getPriorityText(p as PriorityName),
}));

function getKey(item: Priority) {
    return item.id;
}

export const PriorityFilter: FC<{
    text: string;
    value?: string[];
    onChange: (value: string[]) => void;
}> = ({ value = [], onChange, text }) => {
    const values = useMemo(() => {
        return priorities.filter((p) => value.includes(getKey(p)));
    }, [value]);

    return (
        <Tab name="priority" label={<FilterTabLabel text={text} selected={values.map(({ data }) => data)} />}>
            <FilterBase
                key="priority"
                mode="multiple"
                viewMode="union"
                items={priorities}
                value={values}
                keyGetter={getKey}
                onChange={onChange}
                renderItem={({ item, checked, onItemClick }) => (
                    <FilterCheckbox
                        name="priority"
                        value={item.id}
                        checked={checked}
                        onClick={onItemClick}
                        label={item.data}
                    />
                )}
            />
        </Tab>
    );
};
