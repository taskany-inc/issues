import { ComponentProps, FC, useCallback, useMemo } from 'react';

import { useProjectResource } from '../../hooks/useProjectResource';
import { ProjectSettingsUserList } from '../ProjectSettingsUserList/ProjectSettingsUserList';

import { tr } from './ProjectParticipants.i18n';

interface ProjectParticipantsProps {
    id: string;
    participants: ComponentProps<typeof ProjectSettingsUserList>['users'];
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
        <ProjectSettingsUserList
            title={tr('Participants')}
            users={participants}
            filterIds={filterIds}
            onAdd={onAdd}
            onRemove={onRemove}
            triggerText={tr('Add participant')}
        />
    );
};
