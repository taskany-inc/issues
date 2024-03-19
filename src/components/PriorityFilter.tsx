import { FC, useMemo } from 'react';
import { Tab } from '@taskany/bricks';

import { getPriorityText } from './PriorityText/PriorityText';
import { FilterCheckbox } from './FilterCheckbox/FilterCheckbox';
import { FilterBase } from './FilterBase/FilterBase';
import { FilterTabLabel } from './FilterTabLabel/FilterTabLabel';

interface Priority {
    id: string;
    title: string;
    value: number;
}

interface PriorityFilterProps {
    text: string;
    value?: string[];
    priorities: Priority[];
    onChange: (value: string[]) => void;
}

const getKey = (priority: Priority) => priority.id;

export const PriorityFilter: FC<PriorityFilterProps> = ({ text, value = [], priorities, onChange }) => {
    const values = useMemo(() => {
        return priorities.filter((p) => value.includes(getKey(p)));
    }, [value, priorities]);

    return (
        <Tab
            name="priority"
            label={<FilterTabLabel text={text} selected={values.map(({ title }) => getPriorityText(title))} />}
        >
            <FilterBase
                key="priority"
                mode="multiple"
                viewMode="union"
                items={priorities}
                value={values}
                keyGetter={getKey}
                onChange={onChange}
                renderItem={({ item, checked, active, onMouseLeave, onMouseMove, onItemClick }) => (
                    <FilterCheckbox
                        name="priority"
                        value={getKey(item)}
                        checked={checked}
                        focused={active}
                        onMouseLeave={onMouseLeave}
                        onMouseMove={onMouseMove}
                        onClick={onItemClick}
                        label={getPriorityText(item.title)}
                    />
                )}
            />
        </Tab>
    );
};
