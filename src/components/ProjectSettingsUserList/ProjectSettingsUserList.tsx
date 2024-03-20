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
            <Text className={s.Title} size="m" weight="bold">
                {title}
            </Text>
            <div className={s.ListContainer}>
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
