import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

import { createFetcher } from '../../../utils/createFetcher';
import { Goal, Project } from '../../../../graphql/@generated/genql';
import { Button } from '../../../components/Button';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { PageSep } from '../../../components/PageSep';
import { useRouter } from '../../../hooks/router';
import { SettingsCard, SettingsContent } from '../../../components/SettingsContent';
import { Form } from '../../../components/Form';
import { Fieldset } from '../../../components/Fieldset';
import { shallowEqual } from '../../../utils/shallowEqual';
import { gql } from '../../../utils/gql';
import { FormInput } from '../../../components/FormInput';
import { FormAction, FormActions } from '../../../components/FormActions';
import { gapS, gray9, warn0 } from '../../../design/@generated/themes';
import { Text } from '../../../components/Text';
import { dispatchModalEvent, ModalEvent } from '../../../utils/dispatchModal';
import { ModalContent, ModalHeader } from '../../../components/Modal';
import { FormTitle } from '../../../components/FormTitle';
import { ProjectPageLayout } from '../../../components/ProjectPageLayout';

const ModalOnEvent = dynamic(() => import('../../../components/ModalOnEvent'));

const refreshInterval = 3000;

const fetcher = createFetcher((_, key: string) => ({
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
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key } }) => {
        const ssrProps = {
            ssrData: await fetcher(user, key),
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

const schemaProvider = (t: (key: string) => string) =>
    z.object({
        title: z
            .string({
                required_error: t("settings.Project's title is required"),
                invalid_type_error: t("settings.Project's title must be a string"),
            })
            .min(2, {
                message: t("settings.Project's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
    });

type FormType = z.infer<ReturnType<typeof schemaProvider>>;

const ProjectSettingsPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[] }, { key: string }>) => {
    const t = useTranslations('projects');
    const router = useRouter();
    const schema = schemaProvider(t);

    const { data } = useSWR([user, key], (...args) => fetcher(...args), {
        refreshInterval,
    });
    const project: Project = data?.project ?? ssrData.project;

    const [actualFields, setActualFields] = useState<Pick<Project, 'title' | 'description'>>({
        title: project.title,
        description: project.description || '',
    });
    const [formChanged, setFormChanged] = useState(false);

    const { watch, formState, handleSubmit, register } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: actualFields,
    });

    const formValues = watch();

    useEffect(() => {
        setFormChanged(!shallowEqual(formValues, actualFields));
    }, [formValues, actualFields]);

    const update = async (data: FormType) => {
        const promise = gql.mutation({
            updateProject: [
                {
                    data: {
                        key: project.key,
                        flowId: project.flowId,
                        ...data,
                    },
                },
                {
                    title: true,
                    description: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('settings.Something went wrong 😿'),
            loading: t('settings.We are updating project settings'),
            success: t('settings.Voila! Successfully updated 🎉'),
        });

        const res = await promise;

        res.updateProject && setActualFields(res.updateProject);
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const onConfirmationInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDeleteConfirmation(e.currentTarget.value);
    }, []);
    const onDeleteCancel = useCallback(() => {
        setDeleteConfirmation('');
        dispatchModalEvent(ModalEvent.ProjectDeleteModal)();
    }, []);
    const onProjectDelete = useCallback(async () => {
        const res = await gql.mutation({
            deleteProject: [
                {
                    data: {
                        key: project.key,
                    },
                },
                {
                    id: true,
                },
            ],
        });

        res.deleteProject && router.exploreProjects();
    }, [project.key, router]);

    return (
        <ProjectPageLayout
            actions
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('settings.title', {
                project: () => project.title,
            })}
            project={project}
        >
            <PageSep />

            <SettingsContent>
                <SettingsCard>
                    <Form onSubmit={handleSubmit(update)}>
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
                                error={formState.isSubmitted ? formState.errors.title : undefined}
                            />

                            <FormInput
                                {...register('description')}
                                label={t('settings.Description')}
                                flat="both"
                                error={formState.isSubmitted ? formState.errors.description : undefined}
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
                                    onClick={onProjectDelete}
                                    text={t('settings.Yes, delete it')}
                                />
                            </FormAction>
                        </FormActions>
                    </Form>
                </ModalContent>
            </ModalOnEvent>
        </ProjectPageLayout>
    );
};

export default ProjectSettingsPage;
