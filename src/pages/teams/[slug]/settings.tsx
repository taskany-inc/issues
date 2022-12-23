import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import toast from 'react-hot-toast';

import { createFetcher } from '../../../utils/createFetcher';
import { Project, Team } from '../../../../graphql/@generated/genql';
import { Button } from '../../../components/Button';
import { declareSsrProps, ExternalPageProps } from '../../../utils/declareSsrProps';
import { PageSep } from '../../../components/PageSep';
import { SettingsCard, SettingsContent } from '../../../components/SettingsContent';
import { Form } from '../../../components/Form';
import { Fieldset } from '../../../components/Fieldset';
import { shallowEqual } from '../../../utils/shallowEqual';
import { gql } from '../../../utils/gql';
import { FormInput } from '../../../components/FormInput';
import { FormAction, FormActions } from '../../../components/FormActions';
import { TeamPageLayout } from '../../../components/TeamPageLayout';
import { Page } from '../../../components/Page';

const refreshInterval = 3000;

const fetcher = createFetcher((_, slug: string) => ({
    team: [
        {
            slug,
        },
        {
            id: true,
            slug: true,
            title: true,
            description: true,
            activityId: true,
            projects: {
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

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { slug } }) => {
        const ssrProps = {
            ssrData: await fetcher(user, slug),
        };

        if (!ssrProps.ssrData.team) {
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
                required_error: t("settings.Team's title is required"),
                invalid_type_error: t("settings.Team's title must be a string"),
            })
            .min(2, {
                message: t("settings.Team's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
    });

type FormType = z.infer<ReturnType<typeof schemaProvider>>;

const TeamSettingsPage = ({
    user,
    locale,
    ssrTime,
    ssrData,
    params: { slug },
}: ExternalPageProps<{ team: Team }, { slug: string }>) => {
    const t = useTranslations('teams');
    const schema = schemaProvider(t);

    const { data } = useSWR([user, slug], (...args) => fetcher(...args), {
        refreshInterval,
    });
    const team: Team = data?.team ?? ssrData.team;

    const [actualFields, setActualFields] = useState<Pick<Project, 'title' | 'description'>>({
        title: team.title,
        description: team.description || '',
    });
    const [formChanged, setFormChanged] = useState(false);

    const { handleSubmit, watch, register, formState } = useForm<FormType>({
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
            updateTeam: [
                {
                    data: {
                        id: team.id,
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
            loading: t('settings.We are updating team settings'),
            success: t('settings.Voila! Successfully updated 🎉'),
        });

        const res = await promise;

        res.updateTeam && setActualFields(res.updateTeam);
    };

    return (
        <Page
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('settings.title', {
                team: () => team.title,
            })}
        >
            <TeamPageLayout team={team}>
                <PageSep />

                <SettingsContent>
                    <SettingsCard>
                        <Form onSubmit={handleSubmit(update)}>
                            <Fieldset title={t('settings.General')}>
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
                </SettingsContent>
            </TeamPageLayout>
        </Page>
    );
};

export default TeamSettingsPage;
