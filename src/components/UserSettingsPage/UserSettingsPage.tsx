/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { gray10 } from '@taskany/colors';
import {
    Button,
    Fieldset,
    Form,
    FormInput,
    FormAction,
    FormActions,
    FormRadio,
    FormRadioInput,
    BulbOnIcon,
} from '@taskany/bricks';
import { useRouter } from 'next/router';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { shallowEqual } from '../../utils/shallowEqual';
import { trpc } from '../../utils/trpcClient';
import { Page } from '../Page';
import { PageSep } from '../PageSep';
import { Tip } from '../Tip';
import { Keyboard } from '../Keyboard';
import { CommonHeader } from '../CommonHeader';
import { SettingsCard, SettingsContent } from '../SettingsContent';
import { UpdateUser, updateUserSchema } from '../../schema/user';

import { tr } from './UserSettingsPage.i18n';

export const UserSettingsPage = ({ user, locale, ssrTime }: ExternalPageProps) => {
    const router = useRouter();
    const settings = trpc.user.settings.useQuery();
    const updateMutation = trpc.user.update.useMutation();
    const updateSettingsMutation = trpc.user.updateSettings.useMutation();
    const utils = trpc.useContext();

    const [actualUserFields, setActualUserFields] = useState({
        name: user.name,
        nickname: user.nickname,
    });
    const [generalFormChanged, setGeneralFormChanged] = useState(false);

    const generalForm = useForm<UpdateUser>({
        resolver: zodResolver(updateUserSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: actualUserFields,
    });

    const generalFormValues = generalForm.watch();
    useEffect(() => {
        setGeneralFormChanged(!shallowEqual(generalFormValues, actualUserFields));
    }, [generalFormValues, actualUserFields]);

    const updateUser = async (data: UpdateUser) => {
        const promise = updateMutation.mutateAsync(data);

        toast.promise(promise, {
            error: tr('Something went wrong 😿'),
            loading: tr('We are updating user settings'),
            success: tr('Voila! Successfully updated 🎉'),
        });

        const res = await promise;

        if (res) setActualUserFields(res);
    };

    const [appearanceTheme, setAppearanceTheme] = useState(settings?.data?.theme);
    const { resolvedTheme, setTheme } = useTheme();

    const onAppearanceThemeChange = useCallback(
        async (theme?: string) => {
            if (!theme) return;

            const promise = updateSettingsMutation.mutateAsync(
                {
                    theme,
                },
                {
                    onSuccess: () => {
                        utils.user.settings.invalidate();
                        router.reload();
                    },
                },
            );

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are updating user settings'),
                success: tr('Voila! Successfully updated 🎉'),
            });

            const res = await promise;

            if (res.theme) {
                setAppearanceTheme(res.theme);
            }
        },
        [updateSettingsMutation, utils.user.settings, router],
    );

    useEffect(() => {
        if (appearanceTheme) setTheme(appearanceTheme);
    }, [setTheme, appearanceTheme, resolvedTheme]);

    const clearLocalCache = useCallback(() => {
        try {
            window.localStorage.clear();
            toast.success(tr('Local cache cleared successfully'));
            // eslint-disable-next-line no-empty
        } catch (e) {
            toast.error(tr('Something went wrong 😿'));
        }
    }, []);

    const pageTitle = tr
        .raw('title', {
            user: actualUserFields?.name,
        })
        .join('');

    return (
        <Page user={user} locale={locale} ssrTime={ssrTime} title={pageTitle}>
            <CommonHeader preTitle={`Id: ${user.id}`} title={tr('Settings')} />

            <PageSep />

            <SettingsContent>
                <SettingsCard>
                    <Form onSubmit={generalForm.handleSubmit(updateUser)}>
                        <Fieldset title={tr('General')}>
                            <FormInput
                                disabled
                                defaultValue={user.email}
                                label={tr('Email')}
                                autoComplete="off"
                                flat="bottom"
                            />

                            <FormInput
                                {...generalForm.register('name')}
                                label={tr('Name')}
                                autoComplete="off"
                                flat="bottom"
                                error={
                                    generalForm.formState.isSubmitted ? generalForm.formState.errors.name : undefined
                                }
                            />

                            <FormInput
                                {...generalForm.register('nickname')}
                                label={tr('Nickname')}
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
                                    text={tr('Save')}
                                />
                            </FormAction>
                        </FormActions>
                    </Form>
                </SettingsCard>

                <SettingsCard>
                    <Form>
                        <Fieldset title={tr('Appearance')}>
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
                        <Fieldset title={tr('Danger zone')} view="warning">
                            <FormActions>
                                <FormAction left>
                                    <Button
                                        view="warning"
                                        outline
                                        text={tr('Clear local cache')}
                                        onClick={clearLocalCache}
                                    />
                                </FormAction>
                            </FormActions>
                            <FormActions>
                                <FormAction left>
                                    <Button view="warning" text={tr('Sign out')} onClick={() => signOut()} />
                                </FormAction>
                            </FormActions>
                        </Fieldset>
                    </Form>
                </SettingsCard>

                <Tip title={tr('Pro tip!')} icon={<BulbOnIcon size="s" color={gray10} />}>
                    {tr.raw('Press {key} to save settings', {
                        key: <Keyboard key="keyboard" command enter />,
                    })}
                </Tip>
            </SettingsContent>
        </Page>
    );
};
