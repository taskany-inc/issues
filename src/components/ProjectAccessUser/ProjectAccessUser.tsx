import { FC, useCallback, useMemo, useState } from 'react';
import { nullable } from '@taskany/bricks';
import { Fieldset, Switch, SwitchControl } from '@taskany/bricks/harmony';

import { ProjectByIdReturnType } from '../../../trpc/inferredTypes';
import { useProjectResource } from '../../hooks/useProjectResource';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { SettingsCard, SettingsCardItem } from '../SettingsContent/SettingsContent';
import { UserEditableList } from '../UserEditableList/UserEditableList';

import s from './ProjectAccessUser.module.css';
import { tr } from './ProjectAccessUser.i18n';

interface ProjectAccessUserProps {
    project: NonNullable<ProjectByIdReturnType>;
}

export const ProjectAccessUser: FC<ProjectAccessUserProps> = ({ project }) => {
    const filterIds = useMemo(() => project.accessUsers.map(({ id }) => id) ?? [], [project]);
    const [privacyType, setPrivacyType] = useState<'private' | 'public'>(filterIds.length ? 'private' : 'public');
    const { updateProject, checkActivityGoals } = useProjectResource(project.id);

    const onAdd = useCallback(
        (id: string) => {
            updateProject()({
                ...project,
                accessUsers: [...project.accessUsers, { id }],
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

    const onPublicClick = useCallback<React.MouseEventHandler<HTMLButtonElement>>(() => {
        if (!filterIds.length) {
            setPrivacyType('public');
        } else {
            dispatchModalEvent(ModalEvent.ProjectSwitchPublicConfirmModal, {
                onConfirm: () => {
                    updateProject(() => setPrivacyType('public'))({
                        ...project,
                        accessUsers: [],
                    });
                },
            })();
        }
    }, [filterIds, updateProject, project]);

    return (
        <SettingsCard>
            <Fieldset title={tr('Access')}>
                <div className={s.PrivacyTypeSwitch}>
                    <Switch value={privacyType}>
                        <SwitchControl onClick={onPublicClick} text={tr('Public')} value="public" />
                        <SwitchControl onClick={() => setPrivacyType('private')} text={tr('Private')} value="private" />
                    </Switch>
                </div>
                {nullable(privacyType === 'private', () => (
                    <SettingsCardItem>
                        <UserEditableList
                            users={project.accessUsers}
                            filterIds={filterIds}
                            onAdd={onAdd}
                            onRemove={onRemove}
                            triggerText={tr('Add user')}
                            editable
                        />
                    </SettingsCardItem>
                ))}
            </Fieldset>
        </SettingsCard>
    );
};
