/* eslint-disable react-hooks/rules-of-hooks */
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useRouter as useNextRouter } from 'next/router';

import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { Project } from '../../../../graphql/@generated/genql';
import { Button } from '../../Button';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { PageSep } from '../../PageSep';
import { useRouter } from '../../../hooks/router';
import { SettingsCard, SettingsContent } from '../../SettingsContent';
import { Form } from '../../Form';
import { Fieldset } from '../../Fieldset';
import { FormInput } from '../../FormInput';
import { FormAction, FormActions } from '../../FormActions';
import { gapS, gray9, warn0 } from '../../../design/@generated/themes';
import { Text } from '../../Text';
import { dispatchModalEvent, ModalEvent } from '../../../utils/dispatchModal';
import { ModalContent, ModalHeader } from '../../Modal';
import { FormTitle } from '../../FormTitle';
import { ProjectPageLayout } from '../../ProjectPageLayout';
import { Page } from '../../Page';
import {
    UpdateProjectFormType,
    updateProjectSchemaProvider,
    useProjectResource,
} from '../../../hooks/useProjectResource';
import { errorsProvider } from '../../../utils/forms';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { FormMultiInput } from '../../FormMultiInput';

import { tr } from './ProjectSettingsPage.i18n';

const ModalOnEvent = dynamic(() => import('../../ModalOnEvent'));

const projectFetcher = createFetcher((_, key: string) => ({
    project: [
        {
            key,
        },
        {
            id: true,
            key: true,
            title: true,
            description: true,
            flowId: true,
            flow: {
                id: true,
                title: true,
            },
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
            },
            createdAt: true,
            activityId: true,
            activity: {
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
                ghost: {
                    id: true,
                    email: true,
                },
            },
            teams: {
                id: true,
                title: true,
                key: true,
            },
        },
    ],
}));

const teamsFetcher = createFetcher((_, query: string) => ({
    teamCompletion: [
        {
            query,
        },
        {
            id: true,
            title: true,
            description: true,
            flowId: true,
            flow: {
                id: true,
                title: true,
                states: {
                    id: true,
                    title: true,
                    default: true,
                },
            },
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key } }) => {
        const ssrData = await projectFetcher(user, key);

        return ssrData.project
            ? {
                  fallback: {
                      [key]: ssrData,
                  },
              }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

export const ProjectSettingsPage = ({
    user,
    locale,
    ssrTime,
    fallback,
    params: { key },
}: ExternalPageProps<{ key: string }>) => {
    const router = useRouter();
    const nextRouter = useNextRouter();
    const [lastProjectCache, setLastProjectCache] = useLocalStorage('lastProjectCache');
    const [currentProjectCache, setCurrentProjectCache] = useLocalStorage('currentProjectCache');
    const [recentProjectsCache, setRecentProjectsCache] = useLocalStorage('recentProjectsCache', {});

    const { data } = useSWR(key, () => projectFetcher(user, key), {
        fallback,
        refreshInterval,
    });

    if (!data) return null;

    const project = data?.project;

    if (!project) return nextRouter.push('/404');

    const { updateProject, deleteProject } = useProjectResource(project.id);
    const schema = updateProjectSchemaProvider();

    const [actualFields, setActualFields] = useState<Pick<Project, 'title' | 'description' | 'teams'>>({
        title: project.title,
        description: project.description ?? '',
        teams: project.teams ?? [],
    });

    const [formChanged, setFormChanged] = useState(false);
    const {
        watch,
        handleSubmit,
        register,
        control,
        formState: { errors, isSubmitted },
    } = useForm<UpdateProjectFormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: actualFields,
    });

    const errorsResolver = errorsProvider(errors, isSubmitted);
    const formValues = watch();

    useEffect(() => {
        if (
            formValues.title !== actualFields.title ||
            formValues.description !== actualFields.description ||
            formValues.teams
                ?.map((t) => t.id)
                .sort()
                .join() !==
                actualFields.teams
                    ?.map((t) => t!.id)
                    .sort()
                    .join()
        ) {
            setFormChanged(true);
        }
    }, [formValues, actualFields]);

    const onProjectUpdate = useCallback((data: UpdateProjectFormType) => {
        // @ts-ignore
        setActualFields(data);
        setFormChanged(false);
    }, []);

    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const onConfirmationInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDeleteConfirmation(e.currentTarget.value);
    }, []);

    const onDeleteCancel = useCallback(() => {
        setDeleteConfirmation('');
        dispatchModalEvent(ModalEvent.ProjectDeleteModal)();
    }, []);

    const onProjectDelete = useCallback(() => {
        const newRecentProjectsCache = { ...recentProjectsCache };
        if (recentProjectsCache[project.id]) {
            delete newRecentProjectsCache[project.id];
            setRecentProjectsCache(newRecentProjectsCache);
        }

        if (currentProjectCache?.id === project.id) {
            setCurrentProjectCache(null);
        }

        if (lastProjectCache?.id === project.id) {
            setLastProjectCache(null);
        }

        router.exploreProjects();
    }, [
        router,
        project.id,
        recentProjectsCache,
        currentProjectCache,
        lastProjectCache,
        setRecentProjectsCache,
        setCurrentProjectCache,
        setLastProjectCache,
    ]);

    const projectTeamsIds = formValues.teams?.map((team) => team!.id) ?? [];
    const [teamsQuery, setTeamsQuery] = useState('');
    const { data: teams } = useSWR(teamsQuery, (q) => teamsFetcher(user, q));

    return (
        <Page
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={tr.raw('Taskany — {project} — Settings', {
                project: project.title,
            })}
        >
            <ProjectPageLayout actions project={project}>
                <PageSep />

                <SettingsContent>
                    <SettingsCard>
                        <Form onSubmit={handleSubmit(updateProject(onProjectUpdate))}>
                            <Fieldset title={tr('General')}>
                                <FormInput
                                    disabled
                                    defaultValue={project.key}
                                    label={tr('key')}
                                    autoComplete="off"
                                    flat="bottom"
                                />

                                <FormInput
                                    {...register('title')}
                                    label={tr('Title')}
                                    autoComplete="off"
                                    flat="bottom"
                                    error={errorsResolver('title')}
                                />

                                <FormInput
                                    {...register('description')}
                                    label={tr('Description')}
                                    flat="both"
                                    error={errorsResolver('description')}
                                />

                                <Controller
                                    name="teams"
                                    control={control}
                                    render={({ field }) => (
                                        <FormMultiInput
                                            label={tr('Teams')}
                                            query={teamsQuery}
                                            items={teams?.teamCompletion?.filter(
                                                (t) => !projectTeamsIds.includes(t.id),
                                            )}
                                            onInput={(q) => setTeamsQuery(q)}
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
                                        disabled={!formChanged}
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
                                            {tr('Be careful! All data will be lost')}
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
                                project: <b>{project.title}</b>,
                            })}
                        </Text>

                        <br />

                        <Form>
                            <FormInput
                                flat="bottom"
                                placeholder={project.key}
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
                                        disabled={deleteConfirmation !== project.key}
                                        onClick={deleteProject(onProjectDelete)}
                                        text={tr('Yes, delete it')}
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
