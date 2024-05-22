import { ComponentProps, FC, useCallback, useMemo } from 'react';
import { Fieldset } from '@taskany/bricks/harmony';

import { useProjectResource } from '../../hooks/useProjectResource';
import { SettingsCard, SettingsCardItem } from '../SettingsContent/SettingsContent';
import { UserEditableList } from '../UserEditableList/UserEditableList';

import { tr } from './ProjectParticipants.i18n';

interface ProjectParticipantsProps {
    id: string;
    participants: ComponentProps<typeof UserEditableList>['users'];
}

export const ProjectParticipants: FC<ProjectParticipantsProps> = ({ id, participants }) => {
    const filterIds = useMemo(() => participants.map(({ id }) => id), [participants]);
    const { onProjectParticipantAdd, onProjectParticipantRemove } = useProjectResource(id);

    const onAdd = useCallback(
        (user: { id: string }) => {
            onProjectParticipantAdd([user.id]);
        },
        [onProjectParticipantAdd],
    );

    const onRemove = useCallback(
        (id: string) => {
            onProjectParticipantRemove([id]);
        },
        [onProjectParticipantRemove],
    );

    return (
        <SettingsCard>
            <Fieldset title={tr('Participants')}>
                <SettingsCardItem>
                    <UserEditableList
                        users={participants}
                        filterIds={filterIds}
                        onAdd={onAdd}
                        onRemove={onRemove}
                        triggerText={tr('Add participant')}
                        editable
                    />
                </SettingsCardItem>
            </Fieldset>
        </SettingsCard>
    );
};
