/* eslint-disable no-nested-ternary */
import { useMemo } from 'react';
import { UserPic, Tab } from '@taskany/bricks';
import assert from 'assert';

import { usePageContext } from '../../hooks/usePageContext';
import { FilterBase } from '../FilterBase/FilterBase';
import { FilterCheckbox } from '../FilterCheckbox';
import { FilterTabLabel } from '../FilterTabLabel';
import { FilterAutoCompleteInput } from '../FilterAutoCompleteInput/FilterAutoCompleteInput';
import { getUserName } from '../../utils/getUserName';

import { tr } from './UserFilter.i18n';

interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    [key: string]: unknown;
}
interface UserFilterProps {
    tabName: string;
    text: string;
    users: User[];
    value?: string[];
    onChange: (items: string[]) => void;
    onSearchChange: (searchQuery: string) => void;
    title?: {
        inputPlaceholder: string;
        search: string;
    };
}

const getId = (item: User) => item.id;

export const UserFilter: React.FC<UserFilterProps> = ({
    text,
    tabName,
    users,
    value = [],
    onChange,
    onSearchChange,
}) => {
    const { user: authorizedUser } = usePageContext();

    assert(authorizedUser, 'Cannot get current user');

    const itemsToRender = useMemo(() => {
        const indexOfCurrentUser = users.findIndex(({ id }) => id === authorizedUser.id);

        if (indexOfCurrentUser < 0) {
            return users;
        }

        const nextUserList: User[] = [
            {
                id: authorizedUser.id,
                name: getUserName(authorizedUser),
                email: authorizedUser.email,
                image: authorizedUser.email,
            },
        ];

        users.forEach((user) => {
            if (user.id !== authorizedUser.id) {
                nextUserList.push(user);
            }
        });

        return nextUserList;
    }, [users, authorizedUser]);

    const values = useMemo(() => {
        return users.filter((u) => value.includes(getId(u)));
    }, [value, users]);

    return (
        <Tab name={tabName} label={<FilterTabLabel text={text} selected={values.map((user) => getUserName(user))} />}>
            <FilterBase
                key={tabName}
                mode="multiple"
                viewMode="split"
                items={itemsToRender}
                keyGetter={getId}
                value={values}
                onChange={onChange}
                renderItem={({ item, checked, onItemClick }) => {
                    let label = item.name;

                    if (item.id === authorizedUser.activityId) {
                        label += ` (${tr('You')})`;
                    }

                    return (
                        <FilterCheckbox
                            name="user"
                            value={item.id}
                            checked={checked}
                            onClick={onItemClick}
                            iconLeft={<UserPic name={item.name} email={item.email} size={14} />}
                            label={label}
                        />
                    );
                }}
            >
                <FilterAutoCompleteInput onChange={onSearchChange} />
            </FilterBase>
        </Tab>
    );
};
