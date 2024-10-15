import { FC } from 'react';
import { nullable } from '@taskany/bricks';
import { IconXCircleSolid } from '@taskany/icons';
import { User } from '@prisma/client';

import { safeUserData } from '../../utils/getUserName';
import { UserBadge } from '../UserBadge/UserBadge';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';
import { List } from '../List/List';
import { UserDropdown } from '../UserDropdown/UserDropdown';

import { tr } from './UserEditableList.i18n';

export const UserEditableList: FC<{
    editable?: boolean;
    users: { id: string; user: User | null }[] | null;
    filterIds: string[];
    onRemove: (id: string) => void;
    onAdd: (id: string) => void;
    triggerText: string;
}> = ({ editable, users, filterIds, triggerText, onRemove, onAdd }) => (
    <>
        {nullable(users, (list) => (
            <List
                list={list}
                renderItem={(activity) =>
                    nullable(safeUserData(activity), (props) => (
                        <UserBadge {...props}>
                            {nullable(editable, () => (
                                <IconXCircleSolid size="xs" onClick={() => onRemove(activity.id)} />
                            ))}
                        </UserBadge>
                    ))
                }
            />
        ))}

        {nullable(editable, () => (
            <UserDropdown
                mode="single"
                placement="bottom-start"
                placeholder={tr('Type user name or email')}
                filter={filterIds}
                onChange={(user) => onAdd(user.id)}
                renderTrigger={(props) => (
                    <AddInlineTrigger text={triggerText} ref={props.ref} onClick={props.onClick} />
                )}
            />
        ))}
    </>
);
