import { Tab } from '@taskany/bricks';
import { useMemo } from 'react';

import { FilterBase } from './FilterBase/FilterBase';
import { FilterCheckbox } from './FilterCheckbox';
import { FilterTabLabel } from './FilterTabLabel';
import { FilterAutoCompleteInput } from './FilterAutoCompleteInput/FilterAutoCompleteInput';

type Tag = {
    id: string;
    title: string;
    description?: string | null;
};

interface TagFilterProps {
    text: string;
    tags: Tag[];
    value?: string[];
    onChange: (items: string[]) => void;
    onSearchChange: (searchQuery: string) => void;
    title?: {
        search: string;
        inputPlaceholder: string;
    };
}

const getId = (item: Tag) => item.id;

export const TagFilter: React.FC<TagFilterProps> = ({ text, tags, value = [], onChange, onSearchChange }) => {
    const values = useMemo(() => {
        return tags.filter((tag) => value.includes(getId(tag)));
    }, [tags, value]);

    return (
        <Tab name="tags" label={<FilterTabLabel text={text} selected={values.map(({ title }) => title)} />}>
            <FilterBase
                key="tags"
                mode="multiple"
                viewMode="split"
                items={tags}
                keyGetter={getId}
                inputProps={{ onChange: onSearchChange }}
                value={values}
                onChange={onChange}
                renderItem={({ item, checked, onItemClick }) => (
                    <FilterCheckbox
                        name="tag"
                        value={item.id}
                        checked={checked}
                        onClick={onItemClick}
                        label={item.title}
                    />
                )}
            >
                <FilterAutoCompleteInput onChange={onSearchChange} />
            </FilterBase>
        </Tab>
    );
};
