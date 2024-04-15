import { useEffect, useState, useCallback, ChangeEventHandler } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { Fieldset, Form, FormAction, FormActions, FormRadio, FormRadioInput, nullable } from '@taskany/bricks';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import {
    Button,
    FormControl,
    FormControlInput,
    FormControlLabel,
    FormControlError,
    Checkbox,
} from '@taskany/bricks/harmony';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { trpc } from '../../utils/trpcClient';
import { Page } from '../Page/Page';
import { CommonHeader } from '../CommonHeader';
import { SettingsCard, SettingsContent } from '../SettingsContent/SettingsContent';
import { UpdateUser, updateUserSchema } from '../../schema/user';
import { notifyPromise } from '../../utils/notifyPromise';
import { dispatchErrorNotification, dispatchSuccessNotification } from '../../utils/dispatchNotification';
import { userSettings, userSettingsLogoutButton } from '../../utils/domObjects';
import { languages } from '../../utils/getLang';

import s from './UserSettingsPage.module.css';
import { tr } from './UserSettingsPage.i18n';

const RotatableTip = dynamic(() => import('../RotatableTip/RotatableTip'), { ssr: false });

const patchUserSchemaWithAsyncValidate = (validityFn: (val: string) => Promise<boolean>) => {
    return updateUserSchema.merge(
        z.object({
            nickname: updateUserSchema.shape.nickname.refine(
                async (val: string | null) => {
                    if (!val) {
                        return true;
                    }

                    const res = await validityFn(val.trim());

                    return !!res;
                },
                {
                    message: tr('Nickname already exists'),
                },
            ),
        }),
    );
};
export const UserSettingsPage = ({ user, ssrTime }: ExternalPageProps) => {
    const settings = trpc.user.settings.useQuery();
    const updateMutation = trpc.user.update.useMutation();
    const updateSettingsMutation = trpc.user.updateSettings.useMutation();
    const getUserByNicknameMutation = trpc.user.getUserByNickname.useMutation();
    const utils = trpc.useContext();

    const validateNicknameAsync = useCallback(
        async (val: string) => {
            const result = await getUserByNicknameMutation.mutateAsync(val);
            return !result;
        },
        [getUserByNicknameMutation],
    );

    const { reset, watch, handleSubmit, register, formState } = useForm<UpdateUser>({
        resolver: zodResolver(patchUserSchemaWithAsyncValidate(validateNicknameAsync)),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
        defaultValues: {
            name: user.name,
            nickname: user.nickname,
        },
    });

    const updateUser = useCallback(
        async (data: UpdateUser) => {
            const promise = updateMutation.mutateAsync(data);

            const [res] = await notifyPromise(promise, 'userSettingsUpdate');

            if (!res) return;

            reset({
                name: res.name,
                nickname: res.nickname,
            });
        },
        [updateMutation, reset],
    );

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
                    },
                },
            );

            const [res] = await notifyPromise(promise, 'userSettingsUpdate');

            if (res && res.theme) {
                setAppearanceTheme(res.theme);
            }
        },
        [updateSettingsMutation, utils.user.settings],
    );

    const onLocaleChange = useCallback(
        async (locale?: string) => {
            if (!locale) return;

            const promise = updateSettingsMutation.mutateAsync(
                {
                    locale,
                },
                {
                    onSuccess: () => {
                        utils.user.settings.invalidate();
                    },
                },
            );

            await notifyPromise(promise, 'userSettingsUpdate');
        },
        [updateSettingsMutation, utils.user.settings],
    );

    const [betaUser, setBetaUser] = useState(settings?.data?.beta);

    const onBetaUserChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
        async (e) => {
            const beta = e.target.checked;
            setBetaUser(beta);

            const promise = updateSettingsMutation.mutateAsync(
                {
                    beta,
                },
                {
                    onSuccess: () => {
                        utils.user.settings.invalidate();
                    },
                },
            );

            const [res] = await notifyPromise(promise, 'userSettingsUpdate');

            if (res && res.beta) {
                setBetaUser(res.beta);
            }
        },
        [updateSettingsMutation, utils.user.settings],
    );

    useEffect(() => {
        if (appearanceTheme) setTheme(appearanceTheme);
    }, [setTheme, appearanceTheme, resolvedTheme]);

    const clearLocalCache = useCallback(() => {
        try {
            window.localStorage.clear();
            dispatchSuccessNotification('clearLSCache');
        } catch (e) {
            dispatchErrorNotification('error');
        }
    }, []);

    const pageTitle = tr
        .raw('title', {
            user: watch('name'),
        })
        .join('');

    return (
        <Page
            user={user}
            ssrTime={ssrTime}
            title={pageTitle}
            header={<CommonHeader title={`${tr('Settings')} id: ${user.id}`} />}
            {...userSettings.attr}
        >
            <SettingsContent>
                <SettingsCard>
                    <Form onSubmit={handleSubmit(updateUser)}>
                        <Fieldset title={tr('General')}>
                            <FormControl className={s.FormControl}>
                                <FormControlLabel weight="bold" className={s.FormControlLabel}>
                                    {tr('Email')}:
                                </FormControlLabel>
                                <FormControlInput
                                    disabled
                                    defaultValue={user.email}
                                    size="m"
                                    brick="bottom"
                                    className={s.FormControlInput}
                                />
                            </FormControl>

                            <FormControl className={s.FormControl}>
                                <FormControlLabel weight="bold" className={s.FormControlLabel}>
                                    {tr('Name')}:
                                </FormControlLabel>
                                <FormControlInput
                                    {...register('name')}
                                    size="m"
                                    brick="center"
                                    className={s.FormControlInput}
                                />
                                {nullable(formState.isSubmitted, () => (
                                    <FormControlError error={formState.errors.name} />
                                ))}
                            </FormControl>

                            <FormControl className={s.FormControl}>
                                <FormControlLabel weight="bold" className={s.FormControlLabel}>
                                    {tr('Nickname')}:
                                </FormControlLabel>
                                <FormControlInput
                                    {...register('nickname')}
                                    size="m"
                                    brick="top"
                                    className={s.FormControlInput}
                                />
                                {nullable(formState.isSubmitted, () => (
                                    <FormControlError error={formState.errors.nickname} />
                                ))}
                            </FormControl>
                        </Fieldset>

                        <FormActions flat="top">
                            <FormAction left />
                            <FormAction right inline>
                                <Button view="primary" type="submit" disabled={!formState.isDirty} text={tr('Save')} />
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
                <SettingsCard>
                    <Form>
                        <Fieldset title={tr('Locale')}>
                            <FormRadio
                                label="Locale"
                                name="locale"
                                value={settings.data?.locale}
                                onChange={onLocaleChange}
                            >
                                {languages.map((language) => (
                                    <FormRadioInput value={language} label={language} key={language} />
                                ))}
                            </FormRadio>
                        </Fieldset>
                    </Form>
                </SettingsCard>

                <SettingsCard>
                    <Form>
                        <Fieldset title={tr('You are hero')}>
                            <FormControl className={s.FormControl}>
                                <FormControlLabel weight="bold" className={s.FormControlLabel}>
                                    {tr('Beta features')}:
                                </FormControlLabel>
                                <Checkbox checked={betaUser} onChange={onBetaUserChange} />
                            </FormControl>
                        </Fieldset>
                    </Form>
                </SettingsCard>

                <SettingsCard view="warning">
                    <Form>
                        <Fieldset title={tr('Danger zone')} view="warning">
                            <FormActions>
                                <FormAction left>
                                    <Button view="warning" text={tr('Clear local cache')} onClick={clearLocalCache} />
                                </FormAction>
                            </FormActions>
                            <FormActions>
                                <FormAction left>
                                    <Button
                                        view="warning"
                                        text={tr('Sign out')}
                                        onClick={() => signOut()}
                                        {...userSettingsLogoutButton.attr}
                                    />
                                </FormAction>
                            </FormActions>
                        </Fieldset>
                    </Form>
                </SettingsCard>

                <RotatableTip context="settings" />
            </SettingsContent>
        </Page>
    );
};
