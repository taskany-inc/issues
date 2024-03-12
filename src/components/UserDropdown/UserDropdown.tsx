import { ComponentProps, useState } from 'react';
import { User } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { safeUserData } from '../../utils/getUserName';
import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel } from '../Dropdown/Dropdown';

import s from './UserDropdown.module.css';
import { tr } from './UserDropdown.i18n';

interface UserDropdownProps {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    className?: string;
    query?: string;
    value?: Partial<NonNullable<ActivityByIdReturnType>>;
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    filter?: string[];

    onChange?: (activity: NonNullable<ActivityByIdReturnType>) => void;
}

export const UserDropdown = ({ query = '', value, filter, placeholder, onChange, ...props }: UserDropdownProps) => {
    const [inputState, setInputState] = useState(query);

    const { data: suggestions = [] } = trpc.user.suggestions.useQuery(
        {
            query: inputState,
            filter: filter || [],
        },
        {
            enabled: inputState.length >= 2,
            cacheTime: 0,
            staleTime: 0,
        },
    );

    return (
        <Dropdown arrow>
            <DropdownTrigger {...props}>
                {nullable(safeUserData(value), (user) => (
                    <User name={user.name} src={user.image} email={user.email} className={s.Owner} inheritColor />
                ))}
            </DropdownTrigger>
            <DropdownPanel
                width={320}
                title={tr('Suggestions')}
                value={value}
                items={suggestions}
                inputState={inputState}
                selectable
                placeholder={placeholder}
                setInputState={setInputState}
                onChange={onChange}
                renderItem={(props) =>
                    nullable(safeUserData(props.item), (user) => (
                        <User name={user.name} src={user.image} email={user.email} className={s.Owner} />
                    ))
                }
            />
        </Dropdown>
    );
};
