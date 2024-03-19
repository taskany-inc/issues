import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { User, UserGroup } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { safeUserData } from '../../utils/getUserName';
import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';

import s from './UserDropdown.module.css';
import { tr } from './UserDropdown.i18n';

interface UserValue {
    name?: string;
    email?: string;
    image?: string;
}
interface UserDropdownValue {
    id: string;
    user?: UserValue;
}

type UserDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    className?: string;
    query?: string;
    value?: UserDropdownValue | UserDropdownValue[];
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    placement?: ComponentProps<typeof DropdownPanel>['placement'];
    filter?: string[];

    onChange?: (users: UserDropdownValue[]) => void;
    onClose?: () => void;
} & DropdownGuardedProps<UserDropdownValue>;

export const UserDropdown = ({
    query = '',
    value,
    filter,
    mode,
    placeholder,
    placement,
    onChange,
    onClose,
    ...props
}: UserDropdownProps) => {
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
            select(data) {
                return data.reduce<UserDropdownValue[]>((acc, cur) => {
                    const userData = safeUserData(cur);
                    if (userData) acc.push({ id: cur.id, user: userData });
                    return acc;
                }, []);
            },
        },
    );

    const values = useMemo(() => {
        const res: UserDropdownValue[] = [];
        return res.concat(value || []);
    }, [value]);

    const handleClose = useCallback(() => {
        onClose?.();
        setInputState('');
    }, [onClose]);

    return (
        <Dropdown arrow onClose={handleClose}>
            <DropdownTrigger {...props}>
                {nullable(
                    mode === 'multiple' && values.length > 1,
                    () => (
                        <UserGroup users={values.map(safeUserData).filter(Boolean)} />
                    ),
                    nullable(safeUserData(values[0]), (user) => (
                        <User name={user.name} src={user.image} email={user.email} className={s.Owner} />
                    )),
                )}
            </DropdownTrigger>
            <DropdownPanel
                width={320}
                title={tr('Suggestions')}
                value={values}
                items={suggestions}
                inputState={inputState}
                selectable
                placeholder={placeholder}
                setInputState={setInputState}
                mode={mode}
                placement={placement}
                onChange={onChange}
                renderItem={({ item }) =>
                    nullable(item.user, ({ name, image, email }) => (
                        <User name={name} src={image} email={email} className={s.Owner} />
                    ))
                }
            />
        </Dropdown>
    );
};
