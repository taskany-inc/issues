import { ChangeEvent, useCallback, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { nullable } from '@taskany/bricks';
import { IconExclamationCircleSolid, IconPlusCircleOutline } from '@taskany/icons';
import {
    Tip,
    Text,
    Button,
    FormControl,
    FormControlInput,
    FormControlLabel,
    FormControlError,
    Avatar,
    ModalHeader,
    ModalContent,
    Tag,
    TagCleanButton,
    Fieldset,
} from '@taskany/bricks/harmony';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useRouter } from '../../hooks/router';
import { SettingsCard, SettingsContent } from '../SettingsContent/SettingsContent';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { Page } from '../Page/Page';
import { useProjectResource } from '../../hooks/useProjectResource';
import { errorsProvider } from '../../utils/forms';
import { trpc } from '../../utils/trpcClient';
import { ProjectUpdate, projectUpdateSchema } from '../../schema/project';
import { ProjectUpdateReturnType } from '../../../trpc/inferredTypes';
import { TextList, TextListItem } from '../TextList/TextList';
import { CommonHeader } from '../CommonHeader';
import {
    projectSettingsCancelDeleteProjectButton,
    projectSettingsConfirmDeleteProjectButton,
    projectSettingsDeleteProjectInput,
    projectSettingsContent,
    projectSettingsDeleteProjectButton,
    projectSettingsDescriptionInput,
    projectSettingsSaveButton,
    projectSettingsTitleInput,
    projectSettingsDeleteForm,
    projectSettingsTransferForm,
    projectSettingsTransferProjectKeyInput,
    projectSettingsTransferProjectOwnerButton,
    projectSettingsConfirmTransferProjectButton,
    projectSettingsCancelTransferProjectButton,
    projectSettingsTransferProjectButton,
    projectSettingsParentMultiInputTrigger,
    projectSettingsParentMultiInputTagClean,
    pageHeader,
    projectSettingsParentMultiInput,
} from '../../utils/domObjects';
import { ProjectPageTabs } from '../ProjectPageTabs/ProjectPageTabs';
import { ProjectAccessUser } from '../ProjectAccessUser/ProjectAccessUser';
import { AccessUserDeleteErrorModal } from '../AccessUserDeleteErrorModal/AccessUserDeleteErrorModal';
import { ProjectParticipants } from '../ProjectParticipants/ProjectParticipants';
import { ProjectSwitchPublicConfirmModal } from '../ProjectSwitchPublicConfirmModal/ProjectSwitchPublicConfirmModal';
import { FormAction, FormActions } from '../FormActions/FormActions';
import { GoalParentDropdown } from '../GoalParentDropdown/GoalParentDropdown';
import { UserDropdown, UserDropdownValue } from '../UserDropdown/UserDropdown';
import { ProjectContext } from '../ProjectContext/ProjectContext';

import s from './ProjectSettingsPage.module.css';
import { tr } from './ProjectSettingsPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

export const ProjectSettingsPage = ({ user, ssrTime, params: { id } }: ExternalPageProps) => {
    const router = useRouter();
    const project = trpc.v2.project.getById.useQuery({ id, includeChildren: true });

    const { updateProject, deleteProject, transferOwnership } = useProjectResource(id);
    const { data: childrenIds = [] } = trpc.v2.project.deepChildrenIds.useQuery({ in: [{ id }] });

    const {
        handleSubmit,
        reset,
        register,
        control,
        formState: { errors, isSubmitted, isDirty },
    } = useForm<ProjectUpdate>({
        resolver: zodResolver(projectUpdateSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        values: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: project.data!.id,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            title: project.data!.title,
            description: project.data?.description,
            parent: project.data?.parent,
            accessUsers: project.data?.accessUsers,
        },
        defaultValues: {
            id: project.data?.id,
            title: project.data?.title,
            description: project.data?.description,
            parent: project.data?.parent,
            accessUsers: project.data?.accessUsers,
        },
    });

    const errorsResolver = errorsProvider(errors, isSubmitted);

    const onProjectUpdate = useCallback(
        (data: ProjectUpdateReturnType) => {
            reset({
                id: data?.id,
                title: data?.title,
                description: data?.description,
                parent: data?.parent,
                accessUsers: data?.accessUsers,
            });
        },
        [reset],
    );

    const [keyConfirmation, setKeyConfirmation] = useState('');
    const [transferTo, setTransferTo] = useState<UserDropdownValue | undefined>();

    const onConfirmationInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setKeyConfirmation(e.currentTarget.value);
    }, []);

    const onDeleteCancel = useCallback(() => {
        setKeyConfirmation('');
        dispatchModalEvent(ModalEvent.ProjectDeleteModal)();
    }, []);

    const onTransferCancel = useCallback(() => {
        setKeyConfirmation('');
        setTransferTo(undefined);
        dispatchModalEvent(ModalEvent.ProjectTransferModal)();
    }, []);

    const handleDeleteProjectBtnClick = useCallback(() => {
        if (project.data?.children.length) {
            dispatchModalEvent(ModalEvent.ProjectCannotDeleteModal)();
            return;
        }

        dispatchModalEvent(ModalEvent.ProjectDeleteModal)();
    }, [project.data?.children]);

    const onTransferToChange = useCallback((a: UserDropdownValue) => {
        setTransferTo(a);
    }, []);

    const onProjectTransferOwnership = useCallback(() => {
        if (!project.data) return;

        router.project(project.data.id);
    }, [router, project.data]);

    const pageTitle = tr
        .raw('title', {
            project: project.data?.title,
        })
        .join('');

    const ctx = useMemo(() => ({ project: project.data ?? null }), [project]);

    if (!project.data) return null;

    return (
        <ProjectContext.Provider value={ctx}>
            <Page
                user={user}
                ssrTime={ssrTime}
                title={pageTitle}
                header={
                    <CommonHeader title={project.data.title} {...pageHeader.attr}>
                        <ProjectPageTabs id={id} editable />
                    </CommonHeader>
                }
            >
                <SettingsContent {...projectSettingsContent.attr}>
                    <SettingsCard>
                        <form onSubmit={handleSubmit(updateProject(onProjectUpdate))}>
                            <Fieldset title={tr('General')}>
                                <FormControl className={s.FormControl}>
                                    <FormControlLabel className={s.FormControlLabel}>{tr('key')}:</FormControlLabel>
                                    <FormControlInput
                                        size="m"
                                        brick="bottom"
                                        {...register('id')}
                                        disabled
                                        defaultValue={project.data.id}
                                        className={s.FormControlInput}
                                    />
                                </FormControl>

                                <FormControl className={s.FormControl}>
                                    <FormControlLabel className={s.FormControlLabel}>{tr('Title')}:</FormControlLabel>
                                    <FormControlInput
                                        size="m"
                                        brick="center"
                                        {...register('title')}
                                        defaultValue={project.data.title}
                                        {...projectSettingsTitleInput.attr}
                                        className={s.FormControlInput}
                                    />
                                    {nullable(errorsResolver('title'), (error) => (
                                        <FormControlError error={error} />
                                    ))}
                                </FormControl>

                                <FormControl className={s.FormControl}>
                                    <FormControlLabel className={s.FormControlLabel}>
                                        {tr('Description')}:
                                    </FormControlLabel>
                                    <FormControlInput
                                        size="m"
                                        outline={false}
                                        brick="top"
                                        {...register('description')}
                                        defaultValue={project.data?.description ?? undefined}
                                        {...projectSettingsDescriptionInput.attr}
                                        className={s.FormControlInput}
                                    />
                                    {nullable(errorsResolver('description'), (error) => (
                                        <FormControlError error={error} />
                                    ))}
                                </FormControl>

                                <FormControl className={s.FormControl}>
                                    <FormControlLabel className={s.FormControlLabel}>{tr('Parent')}:</FormControlLabel>

                                    <Controller
                                        name="parent"
                                        control={control}
                                        render={({ field }) => {
                                            const value = field.value ?? [];

                                            const onProjectRemove = (project: { id: string }) =>
                                                field.onChange(value.filter((p) => p.id !== project.id) ?? []);

                                            const onProjectAdd = (project: { id: string }) =>
                                                field.onChange([...value, project]);

                                            return (
                                                <div
                                                    className={s.ParentProjects}
                                                    {...projectSettingsParentMultiInput.attr}
                                                >
                                                    {field.value?.map((project) => (
                                                        <Tag
                                                            className={s.Tag}
                                                            key={project.id}
                                                            action={
                                                                <TagCleanButton
                                                                    onClick={() => onProjectRemove(project)}
                                                                    {...projectSettingsParentMultiInputTagClean.attr}
                                                                />
                                                            }
                                                        >
                                                            {project.title}
                                                        </Tag>
                                                    ))}
                                                    <GoalParentDropdown
                                                        mode="single"
                                                        placement="bottom-start"
                                                        onChange={onProjectAdd}
                                                        filter={[id, ...childrenIds.map(({ id }) => id)]}
                                                        value={value}
                                                        renderTrigger={(props) => (
                                                            <IconPlusCircleOutline
                                                                size="xs"
                                                                onClick={props.onClick}
                                                                ref={props.ref}
                                                                {...projectSettingsParentMultiInputTrigger.attr}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                            );
                                        }}
                                    />
                                </FormControl>
                            </Fieldset>

                            <FormActions>
                                <FormAction>
                                    <Button
                                        view="primary"
                                        type="submit"
                                        disabled={!isDirty}
                                        text={tr('Save')}
                                        {...projectSettingsSaveButton.attr}
                                    />
                                </FormAction>
                            </FormActions>
                        </form>
                    </SettingsCard>

                    <ProjectAccessUser project={project.data} />

                    <ProjectParticipants id={project.data.id} participants={project.data.participants} />

                    <SettingsCard view="warning">
                        <Fieldset title={tr('Danger zone')} view="warning">
                            <div className={s.DangerZoneContent}>
                                <FormActions className={s.DangerZoneDeleteProject}>
                                    <Text className={s.FormActionText}>{tr('Be careful — all data will be lost')}</Text>
                                    <FormAction>
                                        <Button
                                            onClick={handleDeleteProjectBtnClick}
                                            view="warning"
                                            text={tr('Delete project')}
                                            {...projectSettingsDeleteProjectButton.attr}
                                        />
                                    </FormAction>
                                </FormActions>

                                <FormActions>
                                    <Text className={s.FormActionText}>{tr('Transfer project to other person')}</Text>
                                    <FormAction>
                                        <Button
                                            onClick={dispatchModalEvent(ModalEvent.ProjectTransferModal)}
                                            view="warning"
                                            text={tr('Transfer ownership')}
                                            {...projectSettingsTransferProjectButton.attr}
                                        />
                                    </FormAction>
                                </FormActions>
                            </div>
                        </Fieldset>
                    </SettingsCard>
                </SettingsContent>

                <AccessUserDeleteErrorModal />

                <ProjectSwitchPublicConfirmModal />

                <ModalOnEvent event={ModalEvent.ProjectDeleteModal}>
                    <ModalHeader view="warning">{tr('You are trying to delete project')}</ModalHeader>

                    <ModalContent>
                        <SettingsCard view="warning">
                            <Tip className={s.Tip} view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                                <Text as="span" weight="semiBold" size="s">
                                    {tr('What happens when you delete a project')}:
                                </Text>
                            </Tip>

                            <TextList className={s.TextList}>
                                <TextListItem className={s.TextListItem}>
                                    <Text size="s">{tr('All active goals will be archived')};</Text>
                                </TextListItem>
                                <TextListItem className={s.TextListItem}>
                                    <Text size="s">{tr('Criteria as project goals will be removed')};</Text>
                                </TextListItem>
                                <TextListItem className={s.TextListItem}>
                                    <Text size="s">
                                        {tr(
                                            'Criteria-affected goals will be recalculated as progress towards meeting the criteria',
                                        )}
                                        ;
                                    </Text>
                                </TextListItem>
                                <TextListItem className={s.TextListItem}>
                                    <Text size="s">
                                        {tr(
                                            'For affected projects, average progress across all goals will be recalculated',
                                        )}
                                        .
                                    </Text>
                                </TextListItem>
                            </TextList>
                        </SettingsCard>
                        <br />
                        <Text>
                            {tr.raw('To confirm deleting project {project} please type project key {key} below.', {
                                project: <b key={project.data.title}>{project.data.title}</b>,
                                key: <b key={project.data.id}>{project.data.id}</b>,
                            })}
                        </Text>

                        <br />

                        <form {...projectSettingsDeleteForm.attr}>
                            <FormControl>
                                <FormControlInput
                                    size="m"
                                    brick="bottom"
                                    placeholder={tr('Project key')}
                                    onChange={onConfirmationInputChange}
                                    {...projectSettingsDeleteProjectInput.attr}
                                />
                            </FormControl>

                            <FormActions>
                                <FormAction>
                                    <Button
                                        text={tr('Cancel')}
                                        onClick={onDeleteCancel}
                                        {...projectSettingsCancelDeleteProjectButton.attr}
                                    />
                                    <Button
                                        view="warning"
                                        disabled={keyConfirmation !== project.data.id}
                                        onClick={deleteProject()}
                                        text={tr('Yes, delete it')}
                                        {...projectSettingsConfirmDeleteProjectButton.attr}
                                    />
                                </FormAction>
                            </FormActions>
                        </form>
                    </ModalContent>
                </ModalOnEvent>

                <ModalOnEvent event={ModalEvent.ProjectTransferModal}>
                    <ModalHeader view="warning">{tr('You are trying to transfer project ownership')}</ModalHeader>

                    <ModalContent>
                        <Text>
                            {tr.raw(
                                'To confirm transfering {project} ownership please type project key {key} and select new owner below.',
                                {
                                    project: <b key={project.data.title}>{project.data.title}</b>,
                                    key: <b key={project.data.id}>{project.data.id}</b>,
                                },
                            )}
                        </Text>

                        <br />

                        <form {...projectSettingsTransferForm.attr}>
                            <FormControl>
                                <FormControlInput
                                    size="m"
                                    brick="bottom"
                                    placeholder={tr('Project key')}
                                    onChange={onConfirmationInputChange}
                                    {...projectSettingsTransferProjectKeyInput.attr}
                                />
                            </FormControl>
                            <FormActions align="space-between">
                                <FormAction>
                                    <UserDropdown
                                        mode="single"
                                        placement="bottom-start"
                                        placeholder={tr('Enter name or email')}
                                        value={transferTo}
                                        onChange={onTransferToChange}
                                        renderTrigger={(props) => (
                                            <Button
                                                text={
                                                    transferTo?.user?.name ??
                                                    transferTo?.user?.email ??
                                                    tr('New project owner')
                                                }
                                                ref={props.ref}
                                                onClick={props.onClick}
                                                iconLeft={nullable(transferTo?.user, ({ image, email, name }) => (
                                                    <Avatar src={image} email={email} name={name} size="xs" />
                                                ))}
                                                {...projectSettingsTransferProjectOwnerButton.attr}
                                            />
                                        )}
                                    />
                                </FormAction>
                                <FormAction>
                                    <Button
                                        text={tr('Cancel')}
                                        onClick={onTransferCancel}
                                        {...projectSettingsCancelTransferProjectButton.attr}
                                    />
                                    <Button
                                        view="warning"
                                        disabled={!transferTo || keyConfirmation !== project.data.id}
                                        onClick={
                                            transferTo
                                                ? transferOwnership(onProjectTransferOwnership, transferTo.id)
                                                : undefined
                                        }
                                        text={tr('Transfer ownership')}
                                        {...projectSettingsConfirmTransferProjectButton.attr}
                                    />
                                </FormAction>
                            </FormActions>
                        </form>
                    </ModalContent>
                </ModalOnEvent>

                <ModalOnEvent event={ModalEvent.ProjectCannotDeleteModal}>
                    <ModalHeader view="warning">{tr('Cannot delete project now')}</ModalHeader>
                    <ModalContent>
                        <Tip className={s.Tip} view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                            {tr('The project has child projects')}
                        </Tip>
                        <Text size="s">
                            {tr('Before delete a project, you must move it to another project or delete')}
                        </Text>
                        <Button
                            className={s.SubmitButton}
                            view="warning"
                            text={tr('Ok, got it')}
                            onClick={dispatchModalEvent(ModalEvent.ProjectCannotDeleteModal)}
                        />
                    </ModalContent>
                </ModalOnEvent>
            </Page>
        </ProjectContext.Provider>
    );
};
