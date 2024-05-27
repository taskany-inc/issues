import { ComponentProps, useCallback, useMemo, useState } from 'react';
import { User, UserGroup } from '@taskany/bricks/harmony';
import { nullable } from '@taskany/bricks';

import { safeUserData } from '../../utils/getUserName';
import { trpc } from '../../utils/trpcClient';
import { Dropdown, DropdownTrigger, DropdownPanel, DropdownGuardedProps } from '../Dropdown/Dropdown';
import { useUserResource } from '../../hooks/useUserResource';

import s from './UserDropdown.module.css';
import { tr } from './UserDropdown.i18n';

interface UserValue {
    name?: string;
    email: string;
    image?: string;
}
export interface UserDropdownValue {
    id: string;
    user?: UserValue;
}

type UserDropdownProps = {
    error?: ComponentProps<typeof DropdownTrigger>['error'];
    label?: ComponentProps<typeof DropdownTrigger>['label'];
    view?: ComponentProps<typeof DropdownTrigger>['view'];
    renderTrigger?: ComponentProps<typeof DropdownTrigger>['renderTrigger'];
    className?: string;
    query?: string;
    value?: UserDropdownValue | UserDropdownValue[];
    disabled?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    placement?: ComponentProps<typeof DropdownPanel>['placement'];
    filter?: string[];
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

    const { createUserByCrew } = useUserResource();

    const { data: crewUsers } = trpc.crew.getUsers.useQuery(
        { query: inputState, filter },
        {
            enabled: inputState.length >= 2,
            cacheTime: 0,
            staleTime: 0,
            select(data) {
                return data.reduce<UserDropdownValue[]>((acc, cur) => {
                    acc.push({ id: cur.id, user: cur });
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

    const userGroup = useMemo(() => values.map(safeUserData).filter(Boolean), [values]);
    const handleChange = useCallback(
        async (crewUsers: UserDropdownValue | UserDropdownValue[]) => {
            const lastAddedUser = Array.isArray(crewUsers) ? crewUsers.pop() : crewUsers;

            if (!lastAddedUser && mode === 'multiple') {
                onChange?.([]);
                return;
            }

            if (!lastAddedUser?.user) return;

            const goalsUser = await createUserByCrew(lastAddedUser.user);

            const newUser = {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                id: goalsUser.activityId!,
                user: goalsUser,
            };

            if (mode === 'single') {
                onChange?.(newUser);
                return;
            }

            if (!Array.isArray(crewUsers)) return;

            onChange?.([...crewUsers, newUser]);
        },
        [createUserByCrew, mode, onChange],
    );

    return (
        <Dropdown arrow onClose={handleClose}>
            <DropdownTrigger {...props}>
                {nullable(
                    mode === 'multiple' && userGroup.length > 1,
                    () => (
                        <UserGroup users={userGroup} />
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
                items={crewUsers}
                inputState={inputState}
                selectable
                placeholder={placeholder}
                setInputState={setInputState}
                mode={mode}
                placement={placement}
                onChange={handleChange}
                renderItem={({ item }) =>
                    nullable(item.user, ({ name, image, email }) => (
                        <User name={name} src={image} email={email} className={s.Owner} />
                    ))
                }
            />
        </Dropdown>
    );
};
