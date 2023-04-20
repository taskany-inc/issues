import React, { useCallback } from 'react';
import { Dropdown, MenuItem } from '@taskany/bricks';

import { Project } from '../../graphql/@generated/genql';

import { FiltersMenuItem } from './FiltersMenuItem';

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
    const onProjectClick = useCallback(
        (p: Project) => {
            const selected = new Set(value);
            selected.has(p.id) ? selected.delete(p.id) : selected.add(p.id);
            const newSelected = new Set(selected);

            onChange?.(Array.from(newSelected));
        },
        [onChange, value],
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
                    active={Boolean(value?.length)}
                    disabled={props.disabled}
                    onClick={props.onClick}
                >
                    {props.text}
                </FiltersMenuItem>
            )}
            renderItem={(props) => (
                <MenuItem ghost key={props.item.id} selected={value?.includes(props.item.id)} onClick={props.onClick}>
                    {props.item.title}
                </MenuItem>
            )}
        />
    );
});
