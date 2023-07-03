/* eslint-disable no-nested-ternary */
import { FC, useMemo } from 'react';
import { FiltersDropdownBase, FiltersDropdownItemProps, UserMenuItem } from '@taskany/bricks';

import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { usePageContext } from '../../hooks/usePageContext';

import { tr } from './UserFilter.i18n';

export const UserFilter: FC<{
    users: Array<NonNullable<ActivityByIdReturnType>>;
    text: string;
    value: string[];
    onChange: React.ComponentProps<typeof FiltersDropdownBase>['onChange'];
    onSearchChange: React.ComponentProps<typeof FiltersDropdownBase>['onSearchChange'];
}> = ({ text, value, users, onChange, onSearchChange }) => {
    const { user } = usePageContext();

    const items = useMemo(() => {
        const excludeCurrentUser = users.filter((u) => u.id !== user?.activityId);
        const isCurrentUserInList = users.length !== excludeCurrentUser.length;

        if (isCurrentUserInList) {
            const currentUser = users.filter((u) => u.id === user?.activityId)[0];
            return [
                {
                    id: currentUser.id,
                    data: currentUser,
                },
                ...excludeCurrentUser.map((user) => ({
                    id: user.id,
                    data: user,
                })),
            ];
        }

        return users.map((user) => ({
            id: user.id,
            data: user,
        }));
    }, [user, users]);

    return (
        <FiltersDropdownBase
            onSearchChange={onSearchChange}
            text={text}
            items={items}
            value={value}
            onChange={onChange}
            renderItem={({
                item: { id, data },
                selected,
                onClick,
            }: FiltersDropdownItemProps<NonNullable<ActivityByIdReturnType>>) => (
                <UserMenuItem
                    key={id}
                    email={data.user?.email || data.ghost?.email}
                    name={
                        data.user?.name
                            ? id === user?.activityId
                                ? `${data.user?.name} (${tr('You')})`
                                : data.user?.name
                            : undefined
                    }
                    image={data.user?.image ?? undefined}
                    checked={selected}
                    onClick={onClick}
                />
            )}
        />
    );
};
