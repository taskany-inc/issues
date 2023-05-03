import React, { useMemo } from 'react';
import { FiltersPanelDropdown, useSerializedDropdownItems } from '@taskany/bricks';

import { Tag } from '../../../graphql/@generated/genql';

type TagFilterProps = {
    tags: Array<Tag>;
    title: string;
    id: string;
};

const getDescriptor = (tag: Tag) => ({ id: tag.id, name: tag.title });

export const TagFilter = React.forwardRef<HTMLDivElement, TagFilterProps>(({ id, title, tags }, ref) => {
    const { ids, getValueDescriptor } = useSerializedDropdownItems(tags, getDescriptor);

    return <FiltersPanelDropdown ref={ref} id={id} title={title} items={ids} getValueDescriptor={getValueDescriptor} />;
});
