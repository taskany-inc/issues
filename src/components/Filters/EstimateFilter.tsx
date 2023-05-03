import React, { useMemo } from 'react';
import { FiltersPanelDropdown, useSerializedDropdownItems } from '@taskany/bricks';

import { Estimate } from '../../../graphql/@generated/genql';

type EstimateFilterProps = {
    estimates: Estimate[];
    title: string;
    id: string;
};

const getDescriptor = (estimate: Estimate) => {
    const id = `${estimate.q}/${estimate.y}`;

    return {
        id,
        name: id,
    };
};

export const EstimateFilter = React.forwardRef<HTMLDivElement, EstimateFilterProps>(({ title, estimates, id }, ref) => {
    const { ids, getValueDescriptor } = useSerializedDropdownItems(estimates, getDescriptor);

    return <FiltersPanelDropdown ref={ref} id={id} title={title} items={ids} getValueDescriptor={getValueDescriptor} />;
});
