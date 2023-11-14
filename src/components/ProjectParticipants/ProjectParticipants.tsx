import { FC, useCallback, useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gapM, gray9, gray3 } from '@taskany/colors';

import { trpc } from '../../utils/trpcClient';
import { ActivityByIdReturnType, ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { useProjectResource } from '../../hooks/useProjectResource';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { UserEditableList } from '../UserEditableList/UserEditableList';
import { SettingsCard } from '../SettingsContent';

import { tr } from './ProjectParticipants.i18n';

type User = NonNullable<ActivityByIdReturnType>;

const StyledTitle = styled(Text)`
    padding: ${gapS} ${gapM} ${gapM};
`;

const StyledListContianer = styled.div`
    background-color: ${gray3};
    padding: ${gapS} ${gapM};
`;

export const ProjectParticipants: FC<{
    project: NonNullable<ProjectByIdReturnType>;
}> = ({ project }) => {
    const [userIdToRemove, setUserIdToRemove] = useState<string>('');
    const filterIds = useMemo(() => project.participants.map(({ id }) => id) ?? [], [project]);

    const { updateProject } = useProjectResource(project.id);

    const { data: userToRemoveGoals, status } = trpc.project.getActivityGoals.useQuery(
        {
            id: project.id,
            ownerId: userIdToRemove,
        },
        {
            enabled: Boolean(userIdToRemove),
        },
    );

    const onAdd = useCallback(
        (user: User) => {
            updateProject()({
                ...project,
                participants: [...project.participants, user],
            });
        },
        [updateProject, project],
    );

    useEffect(() => {
        if (userToRemoveGoals && userToRemoveGoals.length) {
            dispatchModalEvent(ModalEvent.ParticipantDeleteError, {
                goals: userToRemoveGoals,
            })();
        }

        if (userToRemoveGoals && !userToRemoveGoals.length) {
            updateProject()({
                ...project,
                participants: project.participants.filter((user) => user.id !== userIdToRemove),
            });
        }
    }, [userIdToRemove, userToRemoveGoals, updateProject, project]);

    useEffect(() => {
        if (status === 'success' || status === 'error') {
            setUserIdToRemove('');
        }
    }, [status]);

    return (
        <SettingsCard>
            <StyledTitle size="m" weight="bold" color={gray9}>
                {tr('Participants')}
            </StyledTitle>
            <StyledListContianer>
                <UserEditableList
                    users={project.participants}
                    filterIds={filterIds}
                    onAdd={onAdd}
                    onRemove={setUserIdToRemove}
                    triggerText={tr('Add participant')}
                    editable
                />
            </StyledListContianer>
        </SettingsCard>
    );
};
