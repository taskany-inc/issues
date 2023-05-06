/* eslint-disable react-hooks/rules-of-hooks */
import { ChangeEvent, useCallback, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { gapS, gray9, warn0 } from '@taskany/colors';
import {
    Button,
    Text,
    Fieldset,
    Form,
    FormInput,
    FormAction,
    FormActions,
    FormTitle,
    FormMultiInput,
    ModalHeader,
    ModalContent,
} from '@taskany/bricks';

import { Activity } from '../../../graphql/@generated/genql';
import { ExternalPageProps } from '../../utils/declareSsrProps';
import { PageSep } from '../PageSep';
import { useRouter } from '../../hooks/router';
import { SettingsCard, SettingsContent } from '../SettingsContent';
import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { ProjectPageLayout } from '../ProjectPageLayout/ProjectPageLayout';
import { Page } from '../Page';
import { useProjectResource } from '../../hooks/useProjectResource';
import { errorsProvider } from '../../utils/forms';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { UserComboBox } from '../UserComboBox';
import { trpc } from '../../utils/trpcClient';
import { ProjectUpdate, projectUpdateSchema } from '../../schema/project';
import { ProjectUpdateReturnType } from '../../../trpc/inferredTypes';

import { tr } from './ProjectSettingsPage.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

export const ProjectSettingsPage = ({ user, locale, ssrTime, params: { id } }: ExternalPageProps) => {
    const router = useRouter();
    const [lastProjectCache, setLastProjectCache] = useLocalStorage('lastProjectCache');
    const [currentProjectCache, setCurrentProjectCache] = useLocalStorage('currentProjectCache');
    const [recentProjectsCache, setRecentProjectsCache] = useLocalStorage('recentProjectsCache', {});

    const project = trpc.project.getById.useQuery(id);

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

    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const onConfirmationInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDeleteConfirmation(e.currentTarget.value);
    }, []);

    const onDeleteCancel = useCallback(() => {
        setDeleteConfirmation('');
        dispatchModalEvent(ModalEvent.ProjectDeleteModal)();
    }, []);

    const onProjectDelete = useCallback(() => {
        if (!project.data) return;

        const newRecentProjectsCache = { ...recentProjectsCache };
        if (recentProjectsCache[project.data.id]) {
            delete newRecentProjectsCache[project.data.id];
            setRecentProjectsCache(newRecentProjectsCache);
        }

        if (currentProjectCache?.id === project.data.id) {
            setCurrentProjectCache(null);
        }

        if (lastProjectCache?.id === project.data.id) {
            setLastProjectCache(null);
        }

        router.exploreProjects();
    }, [
        router,
        project.data,
        recentProjectsCache,
        currentProjectCache,
        lastProjectCache,
        setRecentProjectsCache,
        setCurrentProjectCache,
        setLastProjectCache,
    ]);

    const [transferTo, setTransferTo] = useState<Activity | undefined>();
    const onTransferToChange = useCallback((a: Activity) => {
        setTransferTo(a);
    }, []);
    const onProjectTransferOwnership = useCallback(() => {
        if (!project.data) return;

        router.project(project.data.id);
    }, [router, project.data]);

    const projectParentIds = project.data?.parent?.map((p) => p.id) ?? [];
    const [parentQuery, setParentQuery] = useState('');
    const suggestions = trpc.project.suggestions.useQuery(parentQuery);

    const pageTitle = tr
        .raw('title', {
            project: project.data?.title,
        })
        .join('');

    if (!project.data) return null;

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <ProjectPageLayout
                id={project.data.id}
                title={project.data.title}
                description={project.data.description}
                starred={project.data._isStarred}
                watching={project.data._isWatching}
                stargizers={project.data._count.stargizers}
                owned={project.data._isOwner}
                parent={project.data.parent}
            >
                <PageSep />

                <SettingsContent>
                    <SettingsCard>
                        <Form onSubmit={handleSubmit(updateProject(onProjectUpdate))}>
                            <Fieldset title={tr('General')}>
                                <FormInput
                                    {...register('id')}
                                    disabled
                                    defaultValue={project.data.id}
                                    label={tr('key')}
                                    autoComplete="off"
                                    flat="bottom"
                                />

                                <FormInput
                                    {...register('title')}
                                    defaultValue={project.data.title}
                                    label={tr('Title')}
                                    autoComplete="off"
                                    flat="bottom"
                                    error={errorsResolver('title')}
                                />

                                <FormInput
                                    {...register('description')}
                                    defaultValue={project.data?.description ?? undefined}
                                    label={tr('Description')}
                                    flat="both"
                                    error={errorsResolver('description')}
                                />

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
                                            {...field}
                                        />
                                    )}
                                />
                            </Fieldset>

                            <FormActions flat="top">
                                <FormAction left />
                                <FormAction right inline>
                                    <Button
                                        size="m"
                                        view="primary"
                                        type="submit"
                                        disabled={!isDirty}
                                        text={tr('Save')}
                                    />
                                </FormAction>
                            </FormActions>
                        </Form>
                    </SettingsCard>

                    <SettingsCard view="warning">
                        <Form>
                            <Fieldset title={tr('Danger zone')} view="warning">
                                <FormActions flat="top">
                                    <FormAction left>
                                        <Text color={gray9} style={{ paddingLeft: gapS }}>
                                            {tr('Be careful — all data will be lost')}
                                        </Text>
                                    </FormAction>
                                    <FormAction right inline>
                                        <Button
                                            onClick={dispatchModalEvent(ModalEvent.ProjectDeleteModal)}
                                            size="m"
                                            view="warning"
                                            text={tr('Delete project')}
                                        />
                                    </FormAction>
                                </FormActions>

                                <FormActions flat="top">
                                    <FormAction left>
                                        <Text color={gray9} style={{ paddingLeft: gapS }}>
                                            {tr('Transfer project to other person')}
                                        </Text>
                                    </FormAction>
                                    <FormAction right inline>
                                        <Button
                                            onClick={dispatchModalEvent(ModalEvent.ProjectTransferModal)}
                                            size="m"
                                            view="warning"
                                            text={tr('Transfer ownership')}
                                        />
                                    </FormAction>
                                </FormActions>
                            </Fieldset>
                        </Form>
                    </SettingsCard>
                </SettingsContent>

                <ModalOnEvent view="warn" event={ModalEvent.ProjectDeleteModal}>
                    <ModalHeader>
                        <FormTitle color={warn0}>{tr('You are trying to delete project')}</FormTitle>
                    </ModalHeader>

                    <ModalContent>
                        <Text>
                            {tr.raw('To confirm deleting project {project} please type project key below.', {
                                project: <b key={project.data.title}>{project.data.title}</b>,
                            })}
                        </Text>

                        <br />

                        <Form>
                            <FormInput
                                flat="bottom"
                                placeholder={project.data.id}
                                autoComplete="off"
                                onChange={onConfirmationInputChange}
                            />

                            <FormActions flat="top">
                                <FormAction left />
                                <FormAction right inline>
                                    <Button size="m" text={tr('Cancel')} onClick={onDeleteCancel} />
                                    <Button
                                        size="m"
                                        view="warning"
                                        disabled={deleteConfirmation !== project.data.id}
                                        onClick={deleteProject(onProjectDelete)}
                                        text={tr('Yes, delete it')}
                                    />
                                </FormAction>
                            </FormActions>
                        </Form>
                    </ModalContent>
                </ModalOnEvent>

                <ModalOnEvent view="warn" event={ModalEvent.ProjectTransferModal}>
                    <ModalHeader>
                        <FormTitle color={warn0}>{tr('You are trying to transfer project ownership')}</FormTitle>
                    </ModalHeader>

                    <ModalContent>
                        <Text>
                            {tr.raw('To confirm transfering {project} ownership please select new owner below.', {
                                project: <b key={project.data.title}>{project.data.title}</b>,
                            })}
                        </Text>

                        <br />

                        <Form>
                            <FormActions flat="top">
                                <FormAction left>
                                    <UserComboBox
                                        text={tr('New project owner')}
                                        placeholder={tr('Enter name or email')}
                                        value={transferTo}
                                        onChange={onTransferToChange}
                                    />
                                </FormAction>
                                <FormAction right inline>
                                    <Button size="m" text={tr('Cancel')} onClick={onDeleteCancel} />
                                    <Button
                                        size="m"
                                        view="warning"
                                        disabled={!transferTo}
                                        onClick={
                                            transferTo
                                                ? transferOwnership(onProjectTransferOwnership, transferTo.id)
                                                : undefined
                                        }
                                        text={tr('Transfer ownership')}
                                    />
                                </FormAction>
                            </FormActions>
                        </Form>
                    </ModalContent>
                </ModalOnEvent>
            </ProjectPageLayout>
        </Page>
    );
};
