import React, { useCallback } from 'react';
import { Dropdown } from '@taskany/bricks';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

import { FiltersMenuItem } from './FiltersMenuItem';
import { UserMenuItem } from './UserMenuItem';

interface UserFilterDropdownProps {
    text: React.ComponentProps<typeof Dropdown>['text'];
    value?: Array<string>;
    activity?: Array<NonNullable<ActivityByIdReturnType>>;
    disabled?: React.ComponentProps<typeof Dropdown>['disabled'];

    onChange?: (selected: string[]) => void;
}

export const UserFilterDropdown = React.forwardRef<HTMLDivElement, UserFilterDropdownProps>(
    ({ text, activity, value, disabled, onChange }, ref) => {
        const onUserClick = useCallback(
            (a: NonNullable<ActivityByIdReturnType>) => {
                const selected = new Set(value);
                selected.has(a.id) ? selected.delete(a.id) : selected.add(a.id);
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
                onChange={onUserClick}
                items={activity}
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
                    <UserMenuItem
                        key={props.item.id}
                        email={props.item.user?.email || props.item.ghost?.email}
                        name={props.item.user?.name}
                        image={props.item.user?.image}
                        checked={value?.includes(props.item.id)}
                        onClick={props.onClick}
                    />
                )}
            />
        );
    },
);
