import React, { useMemo } from 'react';
import { FiltersPanelDropdown, useSerializedDropdownItems } from '@taskany/bricks';

import { Activity } from '../../../graphql/@generated/genql';
import { UserMenuItem } from '../UserMenuItem';

type UserFilterProps = {
    title: string;
    id: string;
    activities: Activity[];
};

const getDescriptor = (activity: Activity) => ({
    id: activity.id,
    name: activity.user?.email || '',
    item: activity,
});

export const UserFilter = React.forwardRef<HTMLDivElement, UserFilterProps>(({ id, title, activities }, ref) => {
    const { ids, getValueDescriptor } = useSerializedDropdownItems(activities, getDescriptor);

    return (
        <FiltersPanelDropdown
            ref={ref}
            id={id}
            title={title}
            items={ids}
            getValueDescriptor={getValueDescriptor}
            renderItem={(props) => (
                <UserMenuItem
                    key={props.item.id}
                    email={props.item.item.user?.email || props.item.item.ghost?.email}
                    name={props.item.item.user?.name}
                    image={props.item.item.user?.image}
                    checked={props.selected}
                    onClick={props.onClick}
                />
            )}
        />
    );
});
