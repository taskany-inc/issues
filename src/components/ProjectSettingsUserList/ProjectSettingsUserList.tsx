import { Text } from '@taskany/bricks/harmony';
import { ComponentProps } from 'react';

import { SettingsCard } from '../SettingsContent/SettingsContent';
import { UserEditableList } from '../UserEditableList/UserEditableList';

import s from './ProjectSettingsUserList.module.css';

interface ProjectSettingsUserListProps extends ComponentProps<typeof UserEditableList> {
    title: string;
}

export const ProjectSettingsUserList = ({
    title,
    users,
    onAdd,
    onRemove,
    triggerText,
    editable = true,
    filterIds,
    ...attrs
}: ProjectSettingsUserListProps) => {
    return (
        <SettingsCard {...attrs}>
            <Text size="m" weight="bold" className={s.UserListTitle}>
                {title}
            </Text>
            <div className={s.UserListContainer}>
                <UserEditableList
                    users={users}
                    filterIds={filterIds}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    triggerText={triggerText}
                    editable={editable}
                />
            </div>
        </SettingsCard>
    );
};
