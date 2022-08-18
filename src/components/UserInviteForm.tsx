import { useCallback, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import z from 'zod';
import { FieldError } from 'react-hook-form';
import styled from 'styled-components';

import { gapM, gray7, star0 } from '../design/@generated/themes';
import { gql } from '../utils/gql';
import { KeyCode } from '../hooks/useKeyboard';

import { Icon } from './Icon';
import { Button } from './Button';
import { FormInput } from './FormInput';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { FormTitle } from './FormTitle';
import { Tag } from './Tag';
import { Text } from './Text';

interface UserInviteFormProps {
    onCreate?: () => void;
}

const StyledEmails = styled.div`
    padding: ${gapM} 0;
`;

export const UserInviteForm: React.FC<UserInviteFormProps> = ({ onCreate }) => {
    const t = useTranslations('users.invite');
    const inputRef = useRef<HTMLInputElement>(null);
    const [emails, setEmails] = useState<string[]>([]);
    const [error, setError] = useState<FieldError>();

    const emailSchema = z.string().email({
        message: t('User email is required'),
    });

    const inviteUser = useCallback(async () => {
        if (inputRef.current?.value === '' || emails.length === 0) {
            return;
        }

        const promise = gql.mutation({
            usersInvites: [
                {
                    input: {
                        emails,
                    },
                },
                {
                    id: true,
                    email: true,
                },
            ],
        });

        toast.promise(promise, {
            error: t('Something went wrong 😿'),
            loading: t('We are creating invite'),
            success: t('Voila! Users invited 🎉'),
        });

        await promise;

        onCreate && onCreate();
    }, [emails, onCreate, t]);

    const onInputChange = useCallback(() => {
        setError(undefined);
    }, []);

    const onEmailRemove = useCallback(
        (email: string) => () => {
            setEmails(emails.filter((em) => em !== email));
        },
        [setEmails, emails],
    );

    const onInputKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if ((e.keyCode === KeyCode.Enter || e.keyCode === KeyCode.Space) && inputRef.current && !e.metaKey) {
                e.preventDefault();
                const possibleEmail = inputRef.current.value;

                if (possibleEmail === '') {
                    return;
                }

                try {
                    emailSchema.parse(possibleEmail);
                    setEmails([...emails, possibleEmail]);
                    inputRef.current.value = '';
                } catch (err: unknown) {
                    if (err instanceof Error) {
                        // Zod serialize errors to message field ¯\_(ツ)_/¯
                        const errors = JSON.parse(err.message);
                        setError(errors[0]);
                    }
                }
            }
        },
        [emailSchema, setEmails, emails],
    );

    const isValid = emails.length > 0;

    return (
        <>
            <FormTitle>{t('Invite new users')}</FormTitle>

            <StyledEmails>
                {isValid ? (
                    <>
                        {emails.map((email) => (
                            <Tag key={email} title={email} onHide={onEmailRemove(email)} />
                        ))}
                    </>
                ) : (
                    <Text size="s" color={gray7}>
                        {t.rich('Start typing users emails', {
                            key1: () => <Keyboard enter />,
                            key2: () => <Keyboard space />,
                        })}
                    </Text>
                )}
            </StyledEmails>

            <Form onSubmit={inviteUser}>
                <FormInput
                    ref={inputRef}
                    error={error}
                    placeholder={t('Users emails')}
                    autoFocus
                    flat="bottom"
                    onChange={onInputChange}
                    onKeyDown={onInputKeyDown}
                />

                <FormActions flat="top">
                    <FormAction left />
                    <FormAction right inline>
                        <Button
                            size="m"
                            view="primary"
                            type="submit"
                            disabled={!isValid}
                            text={t('Send invites')}
                            onClick={inviteUser}
                        />
                    </FormAction>
                </FormActions>
            </Form>

            <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                {t.rich('Press key to send invites', {
                    key: () => <Keyboard command enter />,
                })}
            </Tip>
        </>
    );
};
