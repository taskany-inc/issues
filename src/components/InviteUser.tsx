import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Spacer, Text } from '@geist-ui/core';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import z from 'zod';

import { gql } from '../utils/gql';
import { Card } from './Card';
import { Icon } from './Icon';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormActions, FormActionRight, FormActionLeft } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { accentIconColor } from '../design/@generated/themes';

interface InviteUserProps {
    card?: boolean;
    onCreate?: (id?: string) => void;
}

export const InviteUser: React.FC<InviteUserProps> = ({ card, onCreate }) => {
    const { data: session } = useSession();
    const t = useTranslations('users.invite');

    const schema = z.object({
        email: z
            .string({
                required_error: t('User email is required'),
                invalid_type_error: t('User email must be a string'),
            })
            .email({
                message: t('User email is required'),
            }),
    });

    type FormType = z.infer<typeof schema>;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitted },
    } = useForm<FormType>({
        resolver: zodResolver(schema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldFocusError: true,
    });

    const inviteUser = async ({ email }: FormType) => {
        const promise = gql.mutation({
            inviteUser: [
                {
                    user: session!.user,
                    email,
                },
                {
                    id: true,
                    email: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating invite...'),
            success: t('Voila! User with email {email} invited 🎉', { email }),
        });

        const res = await promise;

        onCreate && onCreate(res.inviteUser?.id);
    };

    const formContent = (
        <Form onSubmit={handleSubmit(inviteUser)}>
            <Text h1>{t('Invite new user')}</Text>

            <FormInput
                {...register('email')}
                error={isSubmitted ? errors.email : undefined}
                placeholder={t('User email')}
                autoFocus
                flat="bottom"
            />
            <FormActions flat="top">
                <FormActionLeft />
                <FormActionRight>
                    <Button size="l" view="primary-outline" type="submit" disabled={!isValid} text={t('Send invite')} />
                </FormActionRight>
            </FormActions>
            <Spacer />
        </Form>
    );

    return (
        <>
            {card ? <Card style={{ maxWidth: '800px' }}>{formContent}</Card> : formContent}
            <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={accentIconColor} />}>
                {t.rich('Press key to send invite', {
                    key: () => <Keyboard command enter />,
                })}
            </Tip>
        </>
    );
};
