import { ChangeEvent, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import {
    Fieldset,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    FormMultiInput,
    ModalHeader,
    ModalContent,
    nullable,
    UserPic,
    Tag,
    Tip,
} from '@taskany/bricks';
import { IconExclamationCircleSolid, IconPlusCircleOutline, IconXSolid } from '@taskany/icons';
import {
    Text,
    Button,
    FormControl,
    FormControlInput,
    FormControlLabel,
    FormControlError,
} from '@taskany/bricks/harmony';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { useRouter } from '../../hooks/router';
import { SettingsCard, SettingsContent } from '../SettingsContent/SettingsContent';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { Page } from '../Page/Page';
import { useProjectResource } from '../../hooks/useProjectResource';
import { errorsProvider } from '../../utils/forms';
import { UserComboBox } from '../UserComboBox';
import { trpc } from '../../utils/trpcClient';
import { ProjectUpdate, projectUpdateSchema } from '../../schema/project';
import { ActivityByIdReturnType, ProjectUpdateReturnType } from '../../../trpc/inferredTypes';
import { TextList, TextListItem } from '../TextList/TextList';
import { CommonHeader } from '../CommonHeader';
import {
    projectSettingsCancelDeleteProjectButton,
    projectSettingsConfirmDeleteProjectButton,
    projectSettingsDeleteProjectInput,
    projectSettingsContent,
    projectSettingsDeleteProjectButton,
    projectSettingsDescriptionInput,
    projectSettingsParentMultiInput,
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
} from '../../utils/domObjects';
import { safeUserData } from '../../utils/getUserName';
import { ProjectPageTabs } from '../ProjectPageTabs/ProjectPageTabs';
import { ProjectAccessUser } from '../ProjectAccessUser/ProjectAccessUser';
import { AccessUserDeleteErrorModal } from '../AccessUserDeleteErrorModal/AccessUserDeleteErrorModal';
import { ProjectParticipants } from '../ProjectParticipants/ProjectParticipants';

import s from './ProjectSettingsPage.module.css';
import { tr } from './ProjectSettingsPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

export const ProjectSettingsPage = ({ user, ssrTime, params: { id } }: ExternalPageProps) => {
    const router = useRouter();
    const project = trpc.project.getById.useQuery({ id });

    const { updateProject, deleteProject, transferOwnership } = useProjectResource(id);

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
        defaultValues: {
            id: project.data?.id,
            title: project.data?.title,
            description: project.data?.description,
            parent: project.data?.parent,
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
            });
        },
        [reset],
    );

    const [keyConfirmation, setKeyConfirmation] = useState('');
    const [transferTo, setTransferTo] = useState<NonNullable<ActivityByIdReturnType> | undefined>();

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

    const onTransferToChange = useCallback((a: NonNullable<ActivityByIdReturnType>) => {
        setTransferTo(a);
    }, []);
    const onProjectTransferOwnership = useCallback(() => {
        if (!project.data) return;

        router.project(project.data.id);
    }, [router, project.data]);

    const projectParentIds = project.data?.parent?.map((p) => p.id) ?? [];
    const [parentQuery, setParentQuery] = useState('');
    const suggestions = trpc.project.suggestions.useQuery({
        query: parentQuery,
    });

    const pageTitle = tr
        .raw('title', {
            project: project.data?.title,
        })
        .join('');

    if (!project.data) return null;

    return (
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
                    <Form onSubmit={handleSubmit(updateProject(onProjectUpdate))}>
                        <Fieldset title={tr('General')}>
                            <FormControl className={s.FormControl}>
                                <FormControlLabel className={s.FormControlLabel} weight="bold">
                                    {tr('key')}:
                                </FormControlLabel>
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
                                <FormControlLabel className={s.FormControlLabel} weight="bold">
                                    {tr('Title')}:
                                </FormControlLabel>
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
                                <FormControlLabel className={s.FormControlLabel} weight="bold">
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

                            <Controller
                                name="parent"
                                control={control}
                                render={({ field }) => (
                                    <FormMultiInput
                                        label={tr('Parent')}
                                        query={parentQuery}
                                        // FIXME: move filter to server
                                        items={suggestions.data?.filter((p) => !projectParentIds.includes(p.id))}
                                        onInput={(q) => setParentQuery(q)}
                                        renderTrigger={(props) => (
                                            <IconPlusCircleOutline
                                                size="xs"
                                                onClick={props.onClick}
                                                {...projectSettingsParentMultiInputTrigger.attr}
                                            />
                                        )}
                                        renderInput={(props) => (
                                            <FormControl>
                                                <FormControlInput outline autoFocus {...props} />
                                            </FormControl>
                                        )}
                                        renderItem={(item) => (
                                            <Tag className={s.Tag} key={item.id}>
                                                {item.title}
                                                <IconXSolid
                                                    size="xxs"
                                                    onClick={item.onClick}
                                                    {...projectSettingsParentMultiInputTagClean.attr}
                                                />
                                            </Tag>
                                        )}
                                        {...field}
                                        {...projectSettingsParentMultiInput.attr}
                                    />
                                )}
                            />
                        </Fieldset>

                        <FormActions flat="top">
                            <FormAction left />
                            <FormAction right inline>
                                <Button
                                    view="primary"
                                    type="submit"
                                    disabled={!isDirty}
                                    text={tr('Save')}
                                    {...projectSettingsSaveButton.attr}
                                />
                            </FormAction>
                        </FormActions>
                    </Form>
                </SettingsCard>

                <ProjectAccessUser project={project.data} />

                <ProjectParticipants id={project.data.id} participants={project.data.participants} />

                <SettingsCard view="warning">
                    <Form>
                        <Fieldset title={tr('Danger zone')} view="warning">
                            <FormActions flat="top">
                                <FormAction left inline>
                                    <Text className={s.FormAction}>{tr('Be careful — all data will be lost')}</Text>
                                </FormAction>
                                <FormAction right inline>
                                    <Button
                                        onClick={handleDeleteProjectBtnClick}
                                        view="warning"
                                        text={tr('Delete project')}
                                        {...projectSettingsDeleteProjectButton.attr}
                                    />
                                </FormAction>
                            </FormActions>

                            <FormActions flat="top">
                                <FormAction left>
                                    <Text className={s.FormAction}>{tr('Transfer project to other person')}</Text>
                                </FormAction>
                                <FormAction right inline>
                                    <Button
                                        onClick={dispatchModalEvent(ModalEvent.ProjectTransferModal)}
                                        view="warning"
                                        text={tr('Transfer ownership')}
                                        {...projectSettingsTransferProjectButton.attr}
                                    />
                                </FormAction>
                            </FormActions>
                        </Fieldset>
                    </Form>
                </SettingsCard>
            </SettingsContent>

            <AccessUserDeleteErrorModal />

            <ModalOnEvent view="warn" event={ModalEvent.ProjectDeleteModal}>
                <ModalHeader>
                    <FormTitle className={s.ModalHeaderTitle}>{tr('You are trying to delete project')}</FormTitle>
                </ModalHeader>

                <ModalContent>
                    <SettingsCard view="warning">
                        <Tip className={s.Tip} view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                            <Text as="span" weight="bold" size="s">
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

                    <Form {...projectSettingsDeleteForm.attr}>
                        <FormControl>
                            <FormControlInput
                                size="m"
                                brick="bottom"
                                placeholder={tr('Project key')}
                                onChange={onConfirmationInputChange}
                                {...projectSettingsDeleteProjectInput.attr}
                            />
                        </FormControl>

                        <FormActions flat="top">
                            <FormAction left />
                            <FormAction right inline>
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
                    </Form>
                </ModalContent>
            </ModalOnEvent>

            <ModalOnEvent view="warn" event={ModalEvent.ProjectTransferModal}>
                <ModalHeader>
                    <FormTitle className={s.ModalHeaderTitle}>
                        {tr('You are trying to transfer project ownership')}
                    </FormTitle>
                </ModalHeader>

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

                    <Form {...projectSettingsTransferForm.attr}>
                        <FormControl>
                            <FormControlInput
                                size="m"
                                brick="bottom"
                                placeholder={tr('Project key')}
                                onChange={onConfirmationInputChange}
                                {...projectSettingsTransferProjectKeyInput.attr}
                            />
                        </FormControl>
                        <FormActions flat="top">
                            <FormAction left>
                                <UserComboBox
                                    text={tr('New project owner')}
                                    placeholder={tr('Enter name or email')}
                                    value={transferTo}
                                    onChange={onTransferToChange}
                                    renderTrigger={(props) => (
                                        <Button
                                            text={props.text}
                                            disabled={props.disabled}
                                            onClick={props.onClick}
                                            iconLeft={nullable(safeUserData(transferTo), ({ image, email, name }) => (
                                                <UserPic src={image} email={email} name={name} size={16} />
                                            ))}
                                            {...projectSettingsTransferProjectOwnerButton.attr}
                                        />
                                    )}
                                />
                            </FormAction>
                            <FormAction right inline>
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
                    </Form>
                </ModalContent>
            </ModalOnEvent>

            <ModalOnEvent view="warn" event={ModalEvent.ProjectCannotDeleteModal}>
                <ModalHeader>
                    <FormTitle className={s.ModalHeaderTitle}>{tr('Cannot delete project now')}</FormTitle>
                </ModalHeader>
                <ModalContent>
                    <Tip className={s.Tip} view="warning" icon={<IconExclamationCircleSolid size="s" />}>
                        {tr('The project has child projects')}
                    </Tip>
                    <Text size="s">{tr('Before delete a project, you must move it to another project or delete')}</Text>
                    <Button
                        className={s.SubmitButton}
                        view="warning"
                        text={tr('Ok, got it')}
                        onClick={dispatchModalEvent(ModalEvent.ProjectCannotDeleteModal)}
                    />
                </ModalContent>
            </ModalOnEvent>
        </Page>
    );
};
