import { FiltersDropdown } from '@taskany/bricks';
import { FC, useMemo } from 'react';

type Project = {
    id: string;
    title: string;
};

export const ProjectFilter: FC<{
    text: string;
    value: string[];
    projects: Project[];
    onChange: (value: string[]) => void;
}> = ({ text, value, projects, onChange }) => {
    const items = useMemo(() => projects.map(({ id, title }) => ({ id, data: title })), [projects]);

    return <FiltersDropdown text={text} value={value} items={items} onChange={onChange} />;
};
