import React from 'react';
import { FiltersPanelDropdown } from '@taskany/bricks';

const items = ['10', '20', '30', '50', '100'];

type TagFilterProps = {
    title: string;
    id: string;
};

export const LimitFilter = React.forwardRef<HTMLDivElement, TagFilterProps>(({ title, id }, ref) => (
    <FiltersPanelDropdown ref={ref} id={id} title={title} items={items} />
));
