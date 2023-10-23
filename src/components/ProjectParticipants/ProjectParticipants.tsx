import { FC, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapS, gapM, gray9, gray3 } from '@taskany/colors';

import { ActivityByIdReturnType, ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { useProjectResource } from '../../hooks/useProjectResource';
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
    const filterIds = useMemo(() => project.participants.map(({ id }) => id) ?? [], [project]);

    const { updateProject } = useProjectResource(project.id);

    const onAdd = useCallback(
        (user: User) => {
            updateProject()({
                ...project,
                participants: [...project.participants, user],
            });
        },
        [updateProject, project],
    );

    const onRemove = useCallback(
        (id: string) => {
            updateProject()({
                ...project,
                participants: project.participants.filter((user) => user.id !== id),
            });
        },
        [updateProject, project],
    );

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
                    onRemove={onRemove}
                    triggerText={tr('Add participant')}
                    editable
                />
            </StyledListContianer>
        </SettingsCard>
    );
};
