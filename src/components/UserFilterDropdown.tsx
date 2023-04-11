import React, { useCallback, useState } from 'react';
import { Dropdown } from '@taskany/bricks';

import { Activity } from '../../graphql/@generated/genql';

import { FiltersMenuItem } from './FiltersMenuItem';
import { UserMenuItem } from './UserMenuItem';

interface UserFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: Array<string>;
    activity?: Array<Activity | undefined>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

export const UserFilterDropdown = React.forwardRef<HTMLDivElement, UserFilterDropdownProps>(
    ({ text, activity, value, disabled, onChange }, ref) => {
        const [selected, setSelected] = useState<Set<string>>(new Set(value));

        const onUserClick = useCallback(
            (a: Activity) => {
                selected.has(a.id) ? selected.delete(a.id) : selected.add(a.id);
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
                onChange={onUserClick}
                items={activity}
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
                    <UserMenuItem
                        key={props.item.id}
                        email={props.item.user?.email || props.item.ghost?.email}
                        name={props.item.user?.name}
                        image={props.item.user?.image}
                        checked={selected.has(props.item.id)}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
