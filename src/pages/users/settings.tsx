import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import toast from 'react-hot-toast';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';

import { gql } from '../../utils/gql';
import { shallowEqual } from '../../utils/shallowEqual';
import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';
import { star10 } from '../../design/@generated/themes';
import { Settings, User } from '../../../graphql/@generated/genql';
import { useMounted } from '../../hooks/useMounted';
import { Page } from '../../components/Page';
import { PageSep } from '../../components/PageSep';
import { FormInput } from '../../components/FormInput';
import { Form } from '../../components/Form';
import { Tip } from '../../components/Tip';
import { Icon } from '../../components/Icon';
import { Keyboard } from '../../components/Keyboard';
import { FormAction, FormActions } from '../../components/FormActions';
import { Button } from '../../components/Button';
import { Fieldset } from '../../components/Fieldset';
import { FormRadio, FormRadioInput } from '../../components/FormRadio';
import { CommonHeader } from '../../components/CommonHeader';
import { SettingsCard, SettingsContent } from '../../components/SettingsContent';

const refreshInterval = 3000;

const fetcher = createFetcher(() => ({
    settings: {
        id: true,
        theme: true,
    },
}));

export const getServerSideProps = declareSsrProps(
    async ({ user }) => ({
        ssrData: await fetcher(user),
    }),
    {
        private: true,
    },
);

const UserSettingsPage = ({ user, locale, ssrTime, ssrData }: ExternalPageProps<{ settings: Settings }>) => {
    const t = useTranslations('users.settings');

    const mounted = useMounted(refreshInterval);
    const { data: settingsData } = useSWR(mounted ? 'settings' : null, () => fetcher(), {
        refreshInterval,
    });
    // this line is compensation for first render before delayed swr will bring updates
    const settings = settingsData?.settings ?? ssrData.settings;

    const [actualUserFields, setActualUserFields] = useState<Pick<User, 'name' | 'nickname'>>({
        name: user.name,
        nickname: user.nickname || '',
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

    const clearLocalCache = useCallback(() => {
        try {
            window.localStorage.clear();
            toast.success(t('Local cache cleared successfully'));
            // eslint-disable-next-line no-empty
        } catch (e) {
            toast.error(t('Something went wrong 😿'));
        }
    }, [t]);

    return (
        <Page
            user={user}
            locale={locale}
            ssrTime={ssrTime}
            title={t.rich('title', {
                user: () => actualUserFields?.name,
            })}
        >
            <CommonHeader preTitle={`Id: ${user.id}`} title={t('Settings')} />

            <PageSep />

            <SettingsContent>
                <SettingsCard>
                    <Form onSubmit={generalForm.handleSubmit(updateUser)}>
                        <Fieldset title={t('General')}>
                            <FormInput
                                disabled
                                defaultValue={user.email}
                                label={t('Email')}
                                autoComplete="off"
                                flat="bottom"
                            />

                            <FormInput
                                {...generalForm.register('name')}
                                label={t('Name')}
                                autoComplete="off"
                                flat="bottom"
                                error={
                                    generalForm.formState.isSubmitted ? generalForm.formState.errors.name : undefined
                                }
                            />

                            <FormInput
                                {...generalForm.register('nickname')}
                                label={t('Nickname')}
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
                </SettingsCard>

                <SettingsCard>
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
                </SettingsCard>

                <SettingsCard view="warning">
                    <Form>
                        <Fieldset title={t('Danger zone')} view="warning">
                            <FormActions>
                                <FormAction left>
                                    <Button
                                        view="warning"
                                        outline
                                        text={t('Clear local cache')}
                                        onClick={clearLocalCache}
                                    />
                                </FormAction>
                            </FormActions>
                            <FormActions>
                                <FormAction left>
                                    <Button view="warning" text={t('Sign out')} onClick={() => signOut()} />
                                </FormAction>
                            </FormActions>
                        </Fieldset>
                    </Form>
                </SettingsCard>

                <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star10} />}>
                    {t.rich('Press key to save settings', {
                        key: () => <Keyboard command enter />,
                    })}
                </Tip>
            </SettingsContent>
        </Page>
    );
};

export default UserSettingsPage;
