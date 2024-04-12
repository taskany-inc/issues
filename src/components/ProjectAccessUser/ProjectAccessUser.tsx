import { FC, useCallback, useMemo } from 'react';

import { ActivityByIdReturnType, ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { useProjectResource } from '../../hooks/useProjectResource';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { ProjectSettingsUserList } from '../ProjectSettingsUserList/ProjectSettingsUserList';

import { tr } from './ProjectAccessUser.i18n';

interface ProjectAccessUserProps {
    project: NonNullable<ProjectByIdReturnType>;
}

export const ProjectAccessUser: FC<ProjectAccessUserProps> = ({ project }) => {
    const filterIds = useMemo(() => project.accessUsers.map(({ id }) => id) ?? [], [project]);
    const { updateProject, checkActivityGoals } = useProjectResource(project.id);

    const onAdd = useCallback(
        (user: NonNullable<ActivityByIdReturnType>) => {
            updateProject()({
                ...project,
                accessUsers: [...project.accessUsers, user],
            });
        },
        [updateProject, project],
    );

    const onRemove = useCallback(
        async (id: string) => {
            const removedUserGoals = await checkActivityGoals(id);

            if (removedUserGoals.length) {
                dispatchModalEvent(ModalEvent.AccessUserDeleteError, {
                    goals: removedUserGoals,
                })();
                return;
            }

            updateProject()({
                ...project,
                accessUsers: project.accessUsers.filter((user) => user.id !== id),
            });
        },
        [checkActivityGoals, project, updateProject],
    );

    return (
        <ProjectSettingsUserList
            title={tr('Access')}
            users={project.accessUsers}
            filterIds={filterIds}
            onAdd={onAdd}
            onRemove={onRemove}
            triggerText={tr('Add user')}
        />
    );
};
