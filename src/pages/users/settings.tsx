import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { useTheme } from 'next-themes';

import { gql } from '../../utils/gql';
import { shallowEqual } from '../../utils/shallowEqual';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { gapM, gapS, gray9, star10 } from '../../design/@generated/themes';
import { Settings, User } from '../../../graphql/@generated/genql';
import { useMounted } from '../../hooks/useMounted';
import { Page, PageContent } from '../../components/Page';
import { Text } from '../../components/Text';
import { PageSep } from '../../components/PageSep';
import { FormCard } from '../../components/FormCard';
import { FormInput } from '../../components/FormInput';
import { Form } from '../../components/Form';
import { Tip } from '../../components/Tip';
import { Icon } from '../../components/Icon';
import { Keyboard } from '../../components/Keyboard';
import { FormAction, FormActions } from '../../components/FormActions';
import { Button } from '../../components/Button';
import { Fieldset } from '../../components/Fieldset';
import { FormRadio, FormRadioInput } from '../../components/FormRadio';

const refreshInterval = 3000;

const StyledUserName = styled(Text)`
    padding-top: ${gapM};
`;

const StyledPageTitle = styled(Text)`
    padding-top: ${gapS};
`;

const StyledUserContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
`;

const StyledSettingsCards = styled.div``;
const StyledFormCard = styled(FormCard)`
    & + & {
        margin-top: ${gapM};
    }
`;

const fetcher = createFetcher((user) => ({
    settings: [
        {
            activityId: user.activityId,
        },
        {
            id: true,
            theme: true,
        },
    ],
}));

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        ssrData: await fetcher(user),
    }),
    {
        private: true,
    },
);

const UserSettingsPage = ({ user, locale, ssrData }: ExternalPageProps<{ settings: Settings }>) => {
    const t = useTranslations('users.settings');
    const [actualUserFields, setActualUserFields] = useState<Pick<User, 'name' | 'nickname'>>({
        name: user?.name,
        nickname: user?.nickname || '',
    });
    const [generalFormChanged, setGeneralFormChanged] = useState(false);

    const generalSchema = z.object({
        name: z
            .string({
                required_error: t('User name is required'),
                invalid_type_error: t('User name must be a string'),
            })
            .min(3, {
                message: t('User name must be longer than 3 symbols'),
            }),
        nickname: z.string().optional(),
    });

    type GeneralFormType = z.infer<typeof generalSchema>;

    const generalForm = useForm<GeneralFormType>({
        resolver: zodResolver(generalSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: actualUserFields,
    });

    const generalFormValues = generalForm.watch();
    useEffect(() => {
        setGeneralFormChanged(!shallowEqual(generalFormValues, actualUserFields));
    }, [generalFormValues, actualUserFields]);

    const updateUser = async (data: GeneralFormType) => {
        const promise = gql.mutation({
            updateUser: [
                {
                    data: {
                        id: user.id,
                        ...data,
                    },
                },
                {
                    name: true,
                    nickname: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are updating user settings'),
            success: t('Voila! Successfully updated 🎉'),
        });

        const res = await promise;

        if (res.updateUser) {
            setActualUserFields(res.updateUser);
        }
    };

    const mounted = useMounted(refreshInterval);
    const { data: settingsData } = useSWR(mounted ? [user] : null, (...args) => fetcher(...args), {
        refreshInterval,
    });

    // this line is compensation for first render before delayed swr will bring updates
    const settings = settingsData?.settings ?? ssrData.settings;
    const [appearanceTheme, setAppearanceTheme] = useState(settings.theme);

    const { resolvedTheme, setTheme } = useTheme();
    const onAppearanceThemeChange = useCallback(
        async (theme?: string) => {
            if (!theme) return;

            const promise = gql.mutation({
                updateSettings: [
                    {
                        data: {
                            id: settings.id,
                            theme,
                        },
                    },
                    {
                        id: true,
                        theme: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: t('Something went wrong 😿'),
                loading: t('We are updating user settings'),
                success: t('Voila! Successfully updated 🎉'),
            });

            const res = await promise;

            if (res.updateSettings) {
                setAppearanceTheme(res.updateSettings?.theme);
            }
        },
        [settings, t],
    );

    useEffect(() => {
        setTheme(appearanceTheme);
    }, [setTheme, appearanceTheme, resolvedTheme]);

    return (
        <Page locale={locale} title={`${t('Settings')} — ${actualUserFields?.name}`}>
            <PageContent>
                <StyledUserName size="l" weight="bold" color={gray9}>
                    {actualUserFields?.name}
                </StyledUserName>
                <StyledPageTitle size="xxl" weight="bolder">
                    {t('Settings')}
                </StyledPageTitle>
            </PageContent>

            <PageSep />

            <StyledUserContent>
                <StyledSettingsCards>
                    <StyledFormCard>
                        <Form onSubmit={generalForm.handleSubmit(updateUser)}>
                            <Fieldset title={t('General')}>
                                <FormInput
                                    disabled
                                    defaultValue={user?.email}
                                    label="Email"
                                    autoComplete="off"
                                    flat="bottom"
                                    error={
                                        generalForm.formState.isSubmitted
                                            ? generalForm.formState.errors.name
                                            : undefined
                                    }
                                />

                                <FormInput
                                    {...generalForm.register('name')}
                                    label="Name"
                                    autoComplete="off"
                                    flat="bottom"
                                    error={
                                        generalForm.formState.isSubmitted
                                            ? generalForm.formState.errors.name
                                            : undefined
                                    }
                                />

                                <FormInput
                                    {...generalForm.register('nickname')}
                                    label="Nickname"
                                    flat="both"
                                    error={
                                        generalForm.formState.isSubmitted
                                            ? generalForm.formState.errors.nickname
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
                    </StyledFormCard>

                    <StyledFormCard>
                        <Form>
                            <Fieldset title={t('Appearance')}>
                                <FormRadio
                                    label="Theme"
                                    name="theme"
                                    value={appearanceTheme}
                                    onChange={onAppearanceThemeChange}
                                >
                                    <FormRadioInput value="system" label="System" />
                                    <FormRadioInput value="dark" label="Dark" />
                                    <FormRadioInput value="light" label="Light" />
                                </FormRadio>
                            </Fieldset>
                        </Form>
                    </StyledFormCard>

                    <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star10} />}>
                        {t.rich('Press key to save setting', {
                            key: () => <Keyboard command enter />,
                        })}
                    </Tip>
                </StyledSettingsCards>
            </StyledUserContent>
        </Page>
    );
};

export default UserSettingsPage;
