import React from 'react';
import { FiltersPanelDropdown, useSerializedDropdownItems } from '@taskany/bricks';

import { Project } from '../../../graphql/@generated/genql';

type ProjectFilterProps = {
    projects: Project[];
    title: string;
    id: string;
};

const getDescriptor = ({ id, title }: Project) => ({ id, name: title });

export const ProjectFilter = React.forwardRef<HTMLDivElement, ProjectFilterProps>(({ id, title, projects }, ref) => {
    const { ids, getValueDescriptor } = useSerializedDropdownItems(projects, getDescriptor);

    return <FiltersPanelDropdown ref={ref} id={id} title={title} items={ids} getValueDescriptor={getValueDescriptor} />;
});
