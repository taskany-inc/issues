/* eslint-disable react-hooks/rules-of-hooks */
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dynamic from 'next/dynamic';
import { useRouter as useNextRouter } from 'next/router';

import { createFetcher } from '../../../utils/createFetcher';
import { Project } from '../../../../graphql/@generated/genql';
import { Button } from '../../../components/Button';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { PageSep } from '../../../components/PageSep';
import { useRouter } from '../../../hooks/router';
import { SettingsCard, SettingsContent } from '../../../components/SettingsContent';
import { Form } from '../../../components/Form';
import { Fieldset } from '../../../components/Fieldset';
import { FormInput } from '../../../components/FormInput';
import { FormAction, FormActions } from '../../../components/FormActions';
import { gapS, gray9, warn0 } from '../../../design/@generated/themes';
import { Text } from '../../../components/Text';
import { dispatchModalEvent, ModalEvent } from '../../../utils/dispatchModal';
import { ModalContent, ModalHeader } from '../../../components/Modal';
import { FormTitle } from '../../../components/FormTitle';
import { ProjectPageLayout } from '../../../components/ProjectPageLayout';
import { Page } from '../../../components/Page';
import {
    UpdateProjectFormType,
    updateProjectSchemaProvider,
    useProjectResource,
} from '../../../hooks/useProjectResource';
import { errorsProvider } from '../../../utils/forms';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { FormMultiInput } from '../../../components/FormMultiInput';

const ModalOnEvent = dynamic(() => import('../../../components/ModalOnEvent'));

const refreshInterval = 3000;

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
        const ssrProps = {
            ssrData: await projectFetcher(user, key),
        };

        if (!ssrProps.ssrData.project) {
            return {
                notFound: true,
            };
        }

        return ssrProps;
    },
    {
        private: true,
    },
);

const ProjectSettingsPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { key },
}: ExternalPageProps<Awaited<ReturnType<typeof projectFetcher>>, { key: string }>) => {
    const t = useTranslations('projects');
    const router = useRouter();
    const nextRouter = useNextRouter();
    const [lastProjectCache, setLastProjectCache] = useLocalStorage('lastProjectCache');
    const [currentProjectCache, setCurrentProjectCache] = useLocalStorage('currentProjectCache');
    const [recentProjectsCache, setRecentProjectsCache] = useLocalStorage('recentProjectsCache', {});

    const { data } = useSWR([user, key], (...args) => projectFetcher(...args), {
        refreshInterval,
        fallbackData: ssrData,
    });

    if (!data) return null;

    const project = data?.project;

    if (!project) return nextRouter.push('/404');

    const { updateProject, deleteProject } = useProjectResource(project.id);
    const schema = updateProjectSchemaProvider(t);

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
            title={t.rich('settings.title', {
                project: () => project.title,
            })}
        >
            <ProjectPageLayout actions project={project}>
                <PageSep />

                <SettingsContent>
                    <SettingsCard>
                        <Form onSubmit={handleSubmit(updateProject(onProjectUpdate, t))}>
                            <Fieldset title={t('settings.General')}>
                                <FormInput
                                    disabled
                                    defaultValue={project.key}
                                    label={t('settings.key')}
                                    autoComplete="off"
                                    flat="bottom"
                                />

                                <FormInput
                                    {...register('title')}
                                    label={t('settings.Title')}
                                    autoComplete="off"
                                    flat="bottom"
                                    error={errorsResolver('title')}
                                />

                                <FormInput
                                    {...register('description')}
                                    label={t('settings.Description')}
                                    flat="both"
                                    error={errorsResolver('description')}
                                />

                                <Controller
                                    name="teams"
                                    control={control}
                                    render={({ field }) => (
                                        <FormMultiInput
                                            label={t('Teams')}
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
                                        text={t('settings.Save')}
                                    />
                                </FormAction>
                            </FormActions>
                        </Form>
                    </SettingsCard>

                    <SettingsCard view="warning">
                        <Form>
                            <Fieldset title={t('settings.Danger zone')} view="warning">
                                <FormActions flat="top">
                                    <FormAction left>
                                        <Text color={gray9} style={{ paddingLeft: gapS }}>
                                            {t('settings.Be careful! All data will be lost')}
                                        </Text>
                                    </FormAction>
                                    <FormAction right inline>
                                        <Button
                                            onClick={dispatchModalEvent(ModalEvent.ProjectDeleteModal)}
                                            size="m"
                                            view="warning"
                                            text={t('settings.Delete project')}
                                        />
                                    </FormAction>
                                </FormActions>
                            </Fieldset>
                        </Form>
                    </SettingsCard>
                </SettingsContent>

                <ModalOnEvent view="warn" event={ModalEvent.ProjectDeleteModal}>
                    <ModalHeader>
                        <FormTitle color={warn0}>{t('settings.You are trying to delete project')}</FormTitle>
                    </ModalHeader>

                    <ModalContent>
                        <Text>
                            {t.rich('settings.To confirm deleting project please type project key below', {
                                project: () => <b>{project.title}</b>,
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
                                    <Button size="m" text={t('settings.Cancel')} onClick={onDeleteCancel} />
                                    <Button
                                        size="m"
                                        view="warning"
                                        disabled={deleteConfirmation !== project.key}
                                        onClick={deleteProject(onProjectDelete, t)}
                                        text={t('settings.Yes, delete it')}
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

export default ProjectSettingsPage;
