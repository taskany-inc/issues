import { Tab } from '@taskany/bricks';
import { useMemo } from 'react';

import { FilterBase } from './FilterBase/FilterBase';
import { FilterCheckbox } from './FilterCheckbox/FilterCheckbox';
import { FilterTabLabel } from './FilterTabLabel/FilterTabLabel';
import { FilterAutoCompleteInput } from './FilterAutoCompleteInput/FilterAutoCompleteInput';

interface Project {
    id: string;
    title: string;
}

interface ProjectFilterAutoCompleteProps {
    text: string;
    projects: Project[];
    value?: string[];
    onChange: (items: string[]) => void;
    onSearchChange: (query: string) => void;
}

const getKey = (project: Project) => project.id;

export const ProjectFilter: React.FC<ProjectFilterAutoCompleteProps> = ({
    text,
    value = [],
    projects,
    onChange,
    onSearchChange,
}) => {
    const values = useMemo(() => {
        return projects.filter((p) => value.includes(getKey(p)));
    }, [value, projects]);

    return (
        <Tab name="projects" label={<FilterTabLabel text={text} selected={values.map(({ title }) => title)} />}>
            <FilterBase
                key="projects"
                mode="multiple"
                viewMode="split"
                items={projects}
                value={values}
                keyGetter={getKey}
                onChange={onChange}
                renderItem={({ item, onItemClick, checked, active, onMouseLeave, onMouseMove }) => (
                    <FilterCheckbox
                        name="project"
                        value={item.id}
                        checked={checked}
                        focused={active}
                        onMouseLeave={onMouseLeave}
                        onMouseMove={onMouseMove}
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
