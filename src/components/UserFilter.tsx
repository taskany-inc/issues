import { FC, useMemo } from 'react';
import { FiltersDropdownBase, FiltersDropdownItemProps, UserMenuItem } from '@taskany/bricks';

import { ActivityByIdReturnType } from '../../trpc/inferredTypes';

export const UserFilter: FC<{
    users: Array<NonNullable<ActivityByIdReturnType>>;
    text: string;
    value: string[];
    onChange: React.ComponentProps<typeof FiltersDropdownBase>['onChange'];
}> = ({ text, users, value, onChange }) => {
    const items = useMemo(
        () =>
            users.map((user) => ({
                id: user.id,
                data: user,
            })),
        [users],
    );

    return (
        <FiltersDropdownBase
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
                    name={data.user?.name ?? undefined}
                    image={data.user?.image ?? undefined}
                    checked={selected}
                    onClick={onClick}
                />
            )}
        />
    );
};
