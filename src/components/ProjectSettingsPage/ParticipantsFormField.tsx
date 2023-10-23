import { FC, useCallback, useMemo } from 'react';

import { UserEditableList } from '../UserEditableList/UserEditableList';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';

import { CustomFormField } from './CustomFormField';
import { tr } from './ProjectSettingsPage.i18n';

type User = NonNullable<ActivityByIdReturnType>;

export const ParticipantsFormField: FC<{
    onChange: (value?: User[]) => void;
    value?: User[];
}> = ({ value = [], onChange }) => {
    const filterIds = useMemo(() => value.map(({ id }) => id) ?? [], [value]);

    const onRemove = useCallback(
        (id: string) => {
            onChange(value.filter((user) => user.id !== id));
        },
        [value, onChange],
    );
    const onAdd = useCallback(
        (user: any) => {
            onChange([...value, user]);
        },
        [value, onChange],
    );

    return (
        <CustomFormField label="Участники">
            <UserEditableList
                users={value}
                filterIds={filterIds}
                onAdd={onAdd}
                onRemove={onRemove}
                triggerText={tr('Add participant')}
                editable
            />
        </CustomFormField>
    );
};
