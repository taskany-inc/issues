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

import { tr } from './ProjectAccessUser.i18n';

const StyledTitle = styled(Text)`
    padding: ${gapS} ${gapM} ${gapM};
`;

const StyledListContianer = styled.div`
    background-color: ${gray3};
    padding: ${gapS} ${gapM};
`;

export const ProjectAccessUser: FC<{
    project: NonNullable<ProjectByIdReturnType>;
}> = ({ project }) => {
    const [userIdToRemove, setUserIdToRemove] = useState<string>('');
    const filterIds = useMemo(() => project.accessUsers.map(({ id }) => id) ?? [], [project]);

    const { updateProject } = useProjectResource(project.id);

    const { data: userToRemoveGoals = [], status } = trpc.project.getActivityGoals.useQuery(
        {
            id: project.id,
            ownerId: userIdToRemove,
        },
        {
            enabled: Boolean(userIdToRemove),
        },
    );

    const onAdd = useCallback(
        (user: NonNullable<ActivityByIdReturnType>) => {
            updateProject()({
                ...project,
                accessUsers: [...project.accessUsers, user],
            });
        },
        [updateProject, project],
    );

    useEffect(() => {
        if (status !== 'success') {
            return;
        }

        if (userToRemoveGoals.length) {
            dispatchModalEvent(ModalEvent.AccessUserDeleteError, {
                goals: userToRemoveGoals,
            })();
        }

        if (!userToRemoveGoals.length) {
            updateProject()({
                ...project,
                accessUsers: project.accessUsers.filter((user) => user.id !== userIdToRemove),
            });
        }
    }, [status, userIdToRemove, userToRemoveGoals, updateProject, project]);

    useEffect(() => {
        if (status === 'success' || status === 'error') {
            setUserIdToRemove('');
        }
    }, [status]);

    return (
        <SettingsCard>
            <StyledTitle size="m" weight="bold" color={gray9}>
                {tr('Access')}
            </StyledTitle>
            <StyledListContianer>
                <UserEditableList
                    users={project.accessUsers}
                    filterIds={filterIds}
                    onAdd={onAdd}
                    onRemove={setUserIdToRemove}
                    triggerText={tr('Add user')}
                    editable
                />
            </StyledListContianer>
        </SettingsCard>
    );
};
