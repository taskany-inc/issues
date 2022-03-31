import type { GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import styled from 'styled-components';
import { Text, Spacer, Button, Breadcrumbs } from '@geist-ui/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import toast from 'react-hot-toast';

import { gql } from '../../utils/gql';
import { Header } from '../../components/Header';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { FormInput } from '../../components/FormInput';
import { FormTextarea } from '../../components/FormTextarea';
import { FormActions, FormActionRight } from '../../components/FormActions';
import { Form } from '../../components/Form';
import { useRouter } from '../../hooks/router';

const StyledDialogPage = styled.main`
    padding: 40px 20px;
`;

function Page() {
    const router = useRouter();
    const { data: session } = useSession();
    const t = useTranslations('teams.new');

    const schema = z.object({
        title: z
            .string({
                required_error: t("Team's title is required"),
                invalid_type_error: t("Team's title must be a string"),
            })
            .min(2, {
                message: t("Team's title must be longer than 2 symbols"),
            }),
        description: z.string().optional(),
    });

    type FormType = z.infer<typeof schema>;

    const {
        watch,
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const title = watch('title');

    const createTeam = async ({ title, description }: FormType) => {
        const promise = gql.mutation({
            createTeam: [
                {
                    user: session!.user,
                    title,
                    description,
                },
                {
                    id: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating new team...'),
            success: t('Voila! Team is here 🎉'),
        });

        const res = await promise;

        router.team(String(res.createTeam?.id));
    };

    return (
        <>
            <Head>
                <title>{t('title')}</title>
            </Head>

            <Header />

            <StyledDialogPage>
                <Breadcrumbs>
                    <Breadcrumbs.Item>
                        <Icon type="building" size="s" />
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>
                        <Icon type="plus" size="s" />
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>
                        <Text>{title || '???'}</Text>
                    </Breadcrumbs.Item>
                </Breadcrumbs>

                <Text h1>{t('Create new team')}</Text>

                <Card style={{ maxWidth: '800px' }}>
                    <Form onSubmit={handleSubmit(createTeam)}>
                        <FormInput
                            {...register('title')}
                            error={isSubmitted ? errors.title : undefined}
                            placeholder={t("Team's title")}
                            flat="bottom"
                        />
                        <FormTextarea
                            {...register('description')}
                            error={isSubmitted ? errors.description : undefined}
                            flat="both"
                            placeholder={t("And its description")}
                        />
                        <FormActions flat="top">
                            <FormActionRight>
                                <Button
                                    ghost
                                    type="success"
                                    scale={0.8}
                                    font={1.2}
                                    style={{ fontWeight: 600 }}
                                    htmlType="submit"
                                    disabled={!isValid}
                                >
                                    {t('Create team')}
                                </Button>
                            </FormActionRight>
                        </FormActions>
                        <Spacer />
                    </Form>
                </Card>
            </StyledDialogPage>
        </>
    );
}

Page.auth = true;

export default Page;

export async function getStaticProps({ locale }: GetStaticPropsContext) {
    return {
        props: {
            i18n: (await import(`../../../i18n/${locale}.json`)).default,
        },
    };
}
