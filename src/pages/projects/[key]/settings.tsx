import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import NextLink from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

import { createFetcher } from '../../../utils/createFetcher';
import { Goal, Project } from '../../../../graphql/@generated/genql';
import { Page } from '../../../components/Page';
import { Button } from '../../../components/Button';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { TabsMenu, TabsMenuItem } from '../../../components/TabsMenu';
import { useMounted } from '../../../hooks/useMounted';
import { PageSep } from '../../../components/PageSep';
import { CommonHeader } from '../../../components/CommonHeader';
import { routes, useRouter } from '../../../hooks/router';
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
import { ProjectWatchButton } from '../../../components/ProjectWatchButton';
import { ProjectStarButton } from '../../../components/ProjectStarButton';

const ModalOnEvent = dynamic(() => import('../../../components/ModalOnEvent'));

const refreshInterval = 3000;

// @ts-ignore
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
            computedActivity: {
                id: true,
                name: true,
                email: true,
                image: true,
            },
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key } }) => ({
        ssrData: await fetcher(user, key),
    }),
    {
        private: true,
    },
);

const StyledProjectActions = styled.div`
    justify-self: right;
    justify-items: end;

    align-content: space-between;

    > * + * {
        margin-left: ${gapS};
    }
`;

const ProjectPage = ({
    user,
    locale,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[] }, { key: string }>) => {
    const t = useTranslations('projects.settings');

    const mounted = useMounted(refreshInterval);
    const { data } = useSWR(mounted ? [user, key] : null, (...args) => fetcher(...args), {
        refreshInterval,
    });

    const project: Project = data?.project ?? ssrData.project;

    const [actualProjectFields, setActualProjectFields] = useState<Pick<Project, 'title' | 'description'>>({
        title: project.title,
        description: project.description || '',
    });
    const [generalFormChanged, setGeneralFormChanged] = useState(false);

    const generalSchema = z.object({
        title: z
            .string({
                required_error: t("Project's title is required"),
                invalid_type_error: t("Project's title must be a string"),
            })
            .min(2, {
                message: t("Project's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
    });

    type GeneralFormType = z.infer<typeof generalSchema>;

    const generalForm = useForm<GeneralFormType>({
        resolver: zodResolver(generalSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: actualProjectFields,
    });

    const generalFormValues = generalForm.watch();
    useEffect(() => {
        setGeneralFormChanged(!shallowEqual(generalFormValues, actualProjectFields));
    }, [generalFormValues, actualProjectFields]);

    const updateProject = async (data: GeneralFormType) => {
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
            error: t('Something went wrong 😿'),
            loading: t('We are updating project settings'),
            success: t('Voila! Successfully updated 🎉'),
        });

        const res = await promise;

        if (res.updateProject) {
            setActualProjectFields(res.updateProject);
        }
    };

    const router = useRouter();
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

        if (res.deleteProject) {
            router.exploreProjects();
        }
    }, [project.key, router]);

    return (
        <Page
            locale={locale}
            title={t.rich('title', {
                project: () => project.title,
            })}
        >
            <CommonHeader
                preTitle={`${t('key')}: ${project.key}`}
                title={project.title}
                description={project.description}
            >
                <StyledProjectActions>
                    <ProjectWatchButton
                        activityId={user.activityId}
                        projectId={project.id}
                        watchers={project.watchers}
                    />
                    <ProjectStarButton
                        activityId={user.activityId}
                        projectId={project.id}
                        stargizers={project.stargizers}
                    />
                </StyledProjectActions>

                <TabsMenu>
                    <NextLink href={routes.project(key)} passHref>
                        <TabsMenuItem>Goals</TabsMenuItem>
                    </NextLink>
                    <TabsMenuItem>Issues</TabsMenuItem>
                    <TabsMenuItem>Boards</TabsMenuItem>
                    <TabsMenuItem>Wiki</TabsMenuItem>
                    <TabsMenuItem active>Settings</TabsMenuItem>
                </TabsMenu>
            </CommonHeader>

            <PageSep />

            <SettingsContent>
                <SettingsCard>
                    <Form onSubmit={generalForm.handleSubmit(updateProject)}>
                        <Fieldset title={t('General')}>
                            <FormInput
                                disabled
                                defaultValue={project.key}
                                label={t('key')}
                                autoComplete="off"
                                flat="bottom"
                            />

                            <FormInput
                                {...generalForm.register('title')}
                                label={t('Title')}
                                autoComplete="off"
                                flat="bottom"
                                error={
                                    generalForm.formState.isSubmitted ? generalForm.formState.errors.title : undefined
                                }
                            />

                            <FormInput
                                {...generalForm.register('description')}
                                label={t('Description')}
                                flat="both"
                                error={
                                    generalForm.formState.isSubmitted
                                        ? generalForm.formState.errors.description
                                        : undefined
                                }
                            />
                        </Fieldset>

                        <FormActions flat="top">
                            <FormAction left />
                            <FormAction right inline>
                                <Button
                                    size="m"
                                    view="primary"
                                    type="submit"
                                    disabled={!generalFormChanged}
                                    text={t('Save')}
                                />
                            </FormAction>
                        </FormActions>
                    </Form>
                </SettingsCard>

                <SettingsCard view="warning">
                    <Form>
                        <Fieldset title={t('Danger zone')} view="warning">
                            <FormActions flat="top">
                                <FormAction left>
                                    <Text color={gray9} style={{ paddingLeft: gapS }}>
                                        {t('Be careful! All data will be lost')}
                                    </Text>
                                </FormAction>
                                <FormAction right inline>
                                    <Button
                                        onClick={dispatchModalEvent(ModalEvent.ProjectDeleteModal)}
                                        size="m"
                                        view="warning"
                                        text={t('Delete project')}
                                    />
                                </FormAction>
                            </FormActions>
                        </Fieldset>
                    </Form>
                </SettingsCard>
            </SettingsContent>

            <ModalOnEvent view="warn" event={ModalEvent.ProjectDeleteModal}>
                <Text color={warn0}>
                    <h2>{t('You are trying to delete project')}</h2>
                </Text>

                <br />

                <Text>
                    {t.rich('To confirm deleting project please type project key below', {
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
                            <Button size="m" text={t('Cancel')} onClick={onDeleteCancel} />
                            <Button
                                size="m"
                                view="warning"
                                disabled={deleteConfirmation !== project.key}
                                onClick={onProjectDelete}
                                text={t('Yes, delete it')}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalOnEvent>
        </Page>
    );
};

export default ProjectPage;
