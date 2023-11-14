import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { UserEditableList } from '../UserEditableList/UserEditableList';
import { ActivityByIdReturnType } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';

import { CustomFormField } from './CustomFormField';
import { tr } from './ProjectSettingsPage.i18n';

type User = NonNullable<ActivityByIdReturnType>;

export const ParticipantsFormField: FC<{
    onChange: (value?: User[]) => void;
    projectId: string | undefined;
    value?: User[];
}> = ({ value = [], onChange, projectId }) => {
    const filterIds = useMemo(() => value.map(({ id }) => id) ?? [], [value]);
    const [userIdToRemove, setUserIdToRemove] = useState<string>();

    const { data, status } = trpc.project.getActivityGoals.useQuery(
        {
            id: projectId as string,
            ownerId: userIdToRemove as string,
        },
        {
            enabled: Boolean(userIdToRemove && projectId),
        },
    );

    const onRemove = useCallback((id: string) => {
        setUserIdToRemove(id);
    }, []);
    const onAdd = useCallback(
        (user: User) => {
            onChange([...value, user]);
        },
        [value, onChange],
    );

    useEffect(() => {
        if (data && data.length) {
            dispatchModalEvent(ModalEvent.ParticipantDeleteError, {
                goals: data,
            })();
        }

        if (data && !data.length) {
            onChange(value.filter((user) => user.id !== userIdToRemove));
        }
    }, [userIdToRemove, data, onChange, value]);

    useEffect(() => {
        if (status === 'success' || status === 'error') {
            setUserIdToRemove(undefined);
        }
    }, [status]);

    return (
        <CustomFormField label={tr('Participants')}>
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
