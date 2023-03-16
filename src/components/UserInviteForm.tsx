import React, { useCallback, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import z from 'zod';
import { FieldError } from 'react-hook-form';
import styled from 'styled-components';

import { Button } from '@common/Button';

import { gapM, gapS, gray6, gray7, star0 } from '../design/@generated/themes';
import { gql } from '../utils/gql';
import { KeyCode } from '../hooks/useKeyboard';
import { routes } from '../hooks/router';
import { usePageContext } from '../hooks/usePageContext';

import { Icon } from './Icon';
import { FormInput } from './FormInput';
import { FormActions, FormAction } from './FormActions';
import { Form } from './Form';
import { Tip } from './Tip';
import { Keyboard } from './Keyboard';
import { FormTitle } from './FormTitle';
import { Tag } from './Tag';
import { Text } from './Text';
import { Link } from './Link';
import { ModalContent, ModalHeader } from './Modal';

const StyledEmails = styled.div`
    padding: ${gapM} 0;
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

const schemaProvider = (t: (key: string) => string) =>
    z.string().email({
        message: t('User email is required'),
    });

const UserInviteForm: React.FC = () => {
    const t = useTranslations('users.invite');
    const { locale } = usePageContext();
    const inputRef = useRef<HTMLInputElement>(null);
    const [emails, setEmails] = useState<string[]>([]);
    const [error, setError] = useState<FieldError>();
    const [inputValue, setInputValue] = useState('');
    const schema = schemaProvider(t);

    const inviteUser = useCallback(async () => {
        if (emails.length === 0) {
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

        setEmails([]);
        setInputValue('');
    }, [emails, t]);

    const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
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
                const possibleEmail = inputValue;

                if (possibleEmail === '') {
                    return;
                }

                try {
                    schema.parse(possibleEmail);
                    setEmails([...emails, possibleEmail]);
                    setInputValue('');
                } catch (err: unknown) {
                    if (err instanceof Error) {
                        // Zod serialize errors to message field ¯\_(ツ)_/¯
                        const errors = JSON.parse(err.message);
                        setError(errors[0]);
                    }
                }
            }
        },
        [schema, setEmails, emails, inputValue],
    );

    const isValid = emails.length > 0;

    return (
        <>
            <ModalHeader>
                <FormTitle>{t('Invite new users')}</FormTitle>
            </ModalHeader>

            <ModalContent>
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

                <Form>
                    <FormInput
                        ref={inputRef}
                        value={inputValue}
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

                <StyledFormBottom>
                    <Tip title={t('Pro tip!')} icon={<Icon type="bulbOn" size="s" color={star0} />}>
                        {t.rich('Press key to send invites', {
                            key: () => <Keyboard command enter />,
                        })}
                    </Tip>

                    <Link href={routes.help(locale, 'users')}>
                        <Icon type="question" size="s" color={gray6} />
                    </Link>
                </StyledFormBottom>
            </ModalContent>
        </>
    );
};

export default UserInviteForm;
