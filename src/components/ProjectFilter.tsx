import { FiltersDropdownBase, MenuItem } from '@taskany/bricks';
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
    onSearchChange: React.ComponentProps<typeof FiltersDropdownBase>['onSearchChange'];
}> = ({ text, value, projects, onChange, onSearchChange }) => {
    const items = useMemo(() => projects.map(({ id, title }) => ({ id, data: title })), [projects]);

    return (
        <FiltersDropdownBase
            text={text}
            value={value}
            items={items}
            onChange={onChange}
            onSearchChange={onSearchChange}
            renderItem={({ item, selected, onClick }) => (
                <MenuItem ghost key={item.id} selected={selected} onClick={onClick}>
                    {item.data}
                </MenuItem>
            )}
        />
    );
};
