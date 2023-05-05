import { FiltersDropdown } from '@taskany/bricks';
import { FC, useMemo } from 'react';

type Tag = {
    id: string;
    title: string;
    description?: string | null;
};

export const TagFilter: FC<{
    text: string;
    value: string[];
    tags: Tag[];
    onChange: (value: string[]) => void;
}> = ({ text, value, tags, onChange }) => {
    const items = useMemo(() => tags.map(({ id, title }) => ({ id, data: title })), [tags]);

    return <FiltersDropdown text={text} value={value} items={items} onChange={onChange} />;
};
