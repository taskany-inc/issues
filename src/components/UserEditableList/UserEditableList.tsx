import { ComponentProps, FC } from 'react';
import { nullable } from '@taskany/bricks';
import { IconXCircleSolid } from '@taskany/icons';
import { User } from '@prisma/client';

import { safeUserData } from '../../utils/getUserName';
import { UserBadge } from '../UserBadge/UserBadge';
import { UserComboBox } from '../UserComboBox';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';
import { List } from '../List/List';

import { tr } from './UserEditableList.i18n';

export const UserEditableList: FC<{
    editable?: boolean;
    users: { id: string; user: User | null }[];
    filterIds: string[];
    onRemove: (id: string) => void;
    onAdd: ComponentProps<typeof UserComboBox>['onChange'];
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
            <UserComboBox
                placement="bottom-start"
                placeholder={tr('Type user name or email')}
                filter={filterIds}
                onChange={onAdd}
                renderTrigger={(props) => <AddInlineTrigger text={triggerText} onClick={props.onClick} />}
            />
        ))}
    </>
);
