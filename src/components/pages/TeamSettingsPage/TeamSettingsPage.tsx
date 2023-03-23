/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import toast from 'react-hot-toast';
import { useRouter as useNextRouter } from 'next/router';

import { Button } from '@common/Button';
import { Form } from '@common/Form';
import { Fieldset } from '@common/Fieldset';

import { createFetcher, refreshInterval } from '../../../utils/createFetcher';
import { Team } from '../../../../graphql/@generated/genql';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { PageSep } from '../../PageSep';
import { SettingsCard, SettingsContent } from '../../SettingsContent';
import { gql } from '../../../utils/gql';
import { FormInput } from '../../FormInput';
import { FormAction, FormActions } from '../../FormActions';
import { TeamPageLayout } from '../../TeamPageLayout';
import { Page } from '../../Page';
import { FormMultiInput } from '../../FormMultiInput';

import { tr } from './TeamSettingsPage.i18n';

const teamFetcher = createFetcher((_, key: string) => ({
    team: [
        {
            key,
        },
        {
            id: true,
            key: true,
            title: true,
            description: true,
            activityId: true,
            projects: {
                id: true,
                key: true,
                title: true,
                description: true,
                createdAt: true,
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
            watchers: {
                id: true,
            },
            stargizers: {
                id: true,
            },
            participants: {
                id: true,
                user: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                },
            },
            createdAt: true,
            activity: {
                id: true,
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

const projectsFetcher = createFetcher((_, query: string) => ({
    projectCompletion: [
        {
            query,
        },
        {
            id: true,
            title: true,
            description: true,
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key } }) => {
        const ssrData = await teamFetcher(user, key);

        return ssrData.team
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

const schemaProvider = () =>
    z.object({
        title: z
            .string({
                required_error: tr("Team's title is required"),
                invalid_type_error: tr("Team's title must be a string"),
            })
            .min(2, {
                message: tr("Team's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
        projects: z
            .array(
                z.object({
                    id: z.number(),
                    title: z.string(),
                }),
            )
            .optional(),
    });

type FormType = z.infer<ReturnType<typeof schemaProvider>>;

export const TeamSettingsPage = ({
    user,
    locale,
    ssrTime,
    fallback,
    params: { key },
}: ExternalPageProps<{ key: string }>) => {
    const schema = schemaProvider();
    const nextRouter = useNextRouter();

    const { data } = useSWR(key, () => teamFetcher(user, key), {
        fallback,
        refreshInterval,
    });

    if (!data) return null;

    const team = data?.team;

    if (!team) return nextRouter.push('/404');

    const [actualFields, setActualFields] = useState<Pick<Team, 'title' | 'description' | 'projects'>>({
        title: team.title,
        description: team.description || '',
        projects: team.projects ?? [],
    });
    const [formChanged, setFormChanged] = useState(false);

    const { handleSubmit, watch, register, control, formState } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: actualFields,
    });

    const formValues = watch();

    useEffect(() => {
        if (
            formValues.title !== actualFields.title ||
            formValues.description !== actualFields.description ||
            formValues.projects
                ?.map((t) => t.id)
                .sort()
                .join() !==
                actualFields.projects
                    ?.map((p) => p!.id)
                    .sort()
                    .join()
        ) {
            setFormChanged(true);
        }
    }, [formValues, actualFields]);

    const update = async (data: FormType) => {
        const promise = gql.mutation({
            updateTeam: [
                {
                    data: {
                        id: team.id,
                        title: data.title,
                        description: data.description,
                        projects: data.projects?.map((project) => project.id) || [],
                    },
                },
                {
                    title: true,
                    description: true,
                    projects: {
                        id: true,
                        title: true,
                    },
                },
            ],
        });

        toast.promise(promise, {
            error: tr('Something went wrong 😿'),
            loading: tr('We are updating team settings'),
            success: tr('Voila! Successfully updated 🎉'),
        });

        const res = await promise;

        // @ts-ignore
        res.updateTeam && setActualFields(res.updateTeam);
        setFormChanged(false);
    };

    const teamProjectsIds = formValues.projects?.map((project) => project!.id) ?? [];
    const [projectsQuery, setProjectsQuery] = useState('');
    const { data: projects } = useSWR(projectsQuery, (q) => projectsFetcher(user, q));

    const pageTitle = tr
        .raw('title', {
            team: team.title,
        })
        .join('');

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <TeamPageLayout team={team}>
                <PageSep />

                <SettingsContent>
                    <SettingsCard>
                        <Form onSubmit={handleSubmit(update)}>
                            <Fieldset title={tr('General')}>
                                <FormInput
                                    {...register('title')}
                                    label={tr('Title')}
                                    autoComplete="off"
                                    flat="bottom"
                                    error={formState.isSubmitted ? formState.errors.title : undefined}
                                />

                                <FormInput
                                    {...register('description')}
                                    label={tr('Description')}
                                    flat="both"
                                    error={formState.isSubmitted ? formState.errors.description : undefined}
                                />

                                <Controller
                                    name="projects"
                                    control={control}
                                    render={({ field }) => (
                                        <FormMultiInput
                                            label={tr('Projects')}
                                            query={projectsQuery}
                                            items={projects?.projectCompletion?.filter(
                                                (p) => !teamProjectsIds.includes(p.id),
                                            )}
                                            onInput={(q) => setProjectsQuery(q)}
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
                </SettingsContent>
            </TeamPageLayout>
        </Page>
    );
};
