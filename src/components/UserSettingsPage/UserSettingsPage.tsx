import { useEffect, useState, useCallback, ChangeEventHandler } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import { Button, Fieldset, Form, FormInput, FormAction, FormActions, FormRadio, FormRadioInput } from '@taskany/bricks';
import { z } from 'zod';
import dynamic from 'next/dynamic';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { trpc } from '../../utils/trpcClient';
import { Page } from '../Page';
import { PageSep } from '../PageSep';
import { CommonHeader } from '../CommonHeader';
import { SettingsCard, SettingsContent } from '../SettingsContent';
import { UpdateUser, updateUserSchema } from '../../schema/user';
import { notifyPromise } from '../../utils/notifyPromise';
import { dispatchErrorNotification, dispatchSuccessNotification } from '../../utils/dispatchNotification';
import { userSettings, userSettingsLogoutButton } from '../../utils/domObjects';

import { tr } from './UserSettingsPage.i18n';

const RotatableTip = dynamic(() => import('../RotatableTip/RotatableTip'), { ssr: false });

const StyledLabel = styled.label`
    padding: 8px 8px 8px 16px;

    background-color: transparent;
`;

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

    const generalForm = useForm<UpdateUser>({
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

            generalForm.reset({
                name: res.name,
                nickname: res.nickname,
            });
        },
        [generalForm, updateMutation],
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
            user: generalForm.watch('name'),
        })
        .join('');

    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle} {...userSettings.attr}>
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
                                    disabled={!generalForm.formState.isDirty}
                                    text={tr('Save')}
                                    outline
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

                <SettingsCard>
                    <Form>
                        <Fieldset title={tr('You are hero')}>
                            <StyledLabel htmlFor="beta">{tr('Beta features')}</StyledLabel>
                            <input id="beta" type="checkbox" checked={betaUser} onChange={onBetaUserChange} />
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
