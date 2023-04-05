import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import { Project } from '../../graphql/@generated/genql';

import { FiltersMenuItem } from './FiltersMenuItem';
import { MenuItem } from './MenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

interface ProjectFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    projects: Project[];
    value?: string[];
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

export const ProjectFilterDropdown: React.FC<ProjectFilterDropdownProps> = React.forwardRef<
    HTMLDivElement,
    ProjectFilterDropdownProps
>(({ text, projects, value, disabled, onChange }, ref) => {
    const [selected, setSelected] = useState(new Set(value));

    useEffect(() => {
        setSelected(new Set(value));
    }, [value]);

    const onProjectClick = useCallback(
        (p: Project) => {
            selected.has(p.id) ? selected.delete(p.id) : selected.add(p.id);
            const newSelected = new Set(selected);
            setSelected(newSelected);

            onChange?.(Array.from(newSelected));
        },
        [onChange, selected],
    );

    return (
        <Dropdown
            ref={ref}
            text={text}
            value={value}
            onChange={onProjectClick}
            items={projects}
            disabled={disabled}
            renderTrigger={(props) => (
                <FiltersMenuItem
                    ref={props.ref}
                    active={Boolean(Array.from(selected).length)}
                    disabled={props.disabled}
                    onClick={props.onClick}
                >
                    {props.text}
                </FiltersMenuItem>
            )}
            renderItem={(props) => (
                <MenuItem ghost key={props.item.id} selected={selected.has(props.item.id)} onClick={props.onClick}>
                    {props.item.title}
                </MenuItem>
            )}
        />
    );
});
