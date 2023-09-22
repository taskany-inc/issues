/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState, useCallback, ChangeEventHandler } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
    Keyboard,
} from '@taskany/bricks';
import { IconBulbOnOutline } from '@taskany/icons';
import { z } from 'zod';

import { ExternalPageProps } from '../../utils/declareSsrProps';
import { shallowEqual } from '../../utils/shallowEqual';
import { trpc } from '../../utils/trpcClient';
import { Page } from '../Page';
import { PageSep } from '../PageSep';
import { Tip } from '../Tip';
import { CommonHeader } from '../CommonHeader';
import { SettingsCard, SettingsContent } from '../SettingsContent';
import { UpdateUser, updateUserSchema } from '../../schema/user';
import { notifyPromise } from '../../utils/notifyPromise';
import { dispatchErrorNotification, dispatchSuccessNotification } from '../../utils/dispatchNotification';

import { tr } from './UserSettingsPage.i18n';

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

    const [actualUserFields, setActualUserFields] = useState({
        name: user.name,
        nickname: user.nickname,
    });
    const [generalFormChanged, setGeneralFormChanged] = useState(false);

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
        defaultValues: actualUserFields,
    });

    const generalFormValues = generalForm.watch();
    useEffect(() => {
        setGeneralFormChanged(!shallowEqual(generalFormValues, actualUserFields));
    }, [generalFormValues, actualUserFields]);

    const updateUser = async (data: UpdateUser) => {
        const promise = updateMutation.mutateAsync(data);

        const [res] = await notifyPromise(promise, 'userSettingsUpdate');

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
            user: actualUserFields?.name,
        })
        .join('');

    return (
        <Page user={user} ssrTime={ssrTime} title={pageTitle}>
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
                                    <Button view="warning" text={tr('Sign out')} onClick={() => signOut()} />
                                </FormAction>
                            </FormActions>
                        </Fieldset>
                    </Form>
                </SettingsCard>

                <Tip title={tr('Pro tip!')} icon={<IconBulbOnOutline size="s" color={gray10} />}>
                    {tr.raw('Press {key} to save settings', {
                        key: <Keyboard key="keyboard" command enter />,
                    })}
                </Tip>
            </SettingsContent>
        </Page>
    );
};
