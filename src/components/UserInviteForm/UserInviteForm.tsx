import React, { useCallback, useState, useRef } from 'react';
import z from 'zod';
import { FieldError } from 'react-hook-form';
import { KeyCode, nullable } from '@taskany/bricks';
import {
    Text,
    Button,
    FormControl,
    Keyboard,
    FormControlInput,
    FormControlError,
    ModalHeader,
    ModalContent,
    Tag,
    TagCleanButton,
} from '@taskany/bricks/harmony';

import { trpc } from '../../utils/trpcClient';
import { notifyPromise } from '../../utils/notifyPromise';
import { HelpButton } from '../HelpButton/HelpButton';
import { TagsList } from '../TagsList/TagsList';
import RotatableTip from '../RotatableTip/RotatableTip';
import { FormAction, FormActions } from '../FormActions/FormActions';

import { tr } from './UserInviteForm.i18n';
import s from './UserInviteForm.module.css';

const schemaProvider = () =>
    z.string().email({
        message: tr('User email is required'),
    });

const UserInviteForm: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [emails, setEmails] = useState<string[]>([]);
    const [error, setError] = useState<FieldError>();
    const [inputValue, setInputValue] = useState('');
    const schema = schemaProvider();
    const inviteMutation = trpc.user.invite.useMutation();

    const inviteUser = useCallback(async () => {
        if (emails.length === 0) {
            return;
        }

        const promise = inviteMutation.mutateAsync(emails);

        await notifyPromise(promise, 'userInvite');

        setEmails([]);
        setInputValue('');
    }, [emails, inviteMutation]);

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
            <ModalHeader>{tr('Invite new users')}</ModalHeader>

            <ModalContent>
                <TagsList className={s.TagsList}>
                    {nullable(
                        isValid,
                        () =>
                            emails.map((email) => (
                                <Tag key={email} action={<TagCleanButton onClick={onEmailRemove(email)} />}>
                                    {email}
                                </Tag>
                            )),
                        <Text size="s" className={s.TagsListPlaceholder}>
                            {tr.raw('Start typing users emails', {
                                key1: <Keyboard enter />,
                                key2: <Keyboard space />,
                            })}
                        </Text>,
                    )}
                </TagsList>

                <form>
                    <FormControl>
                        <FormControlInput
                            ref={inputRef}
                            value={inputValue}
                            placeholder={tr('Users emails')}
                            autoFocus
                            onChange={onInputChange}
                            onKeyDown={onInputKeyDown}
                            size="m"
                            brick="bottom"
                        />
                        {nullable(error, (err) => (
                            <FormControlError error={err} />
                        ))}
                    </FormControl>

                    <FormActions>
                        <FormAction>
                            <Button
                                view="primary"
                                type="submit"
                                disabled={!isValid}
                                text={tr('Send invites')}
                                onClick={inviteUser}
                            />
                        </FormAction>
                    </FormActions>
                </form>

                <div className={s.FormBottom}>
                    <RotatableTip context="invites" />

                    <HelpButton slug="users" />
                </div>
            </ModalContent>
        </>
    );
};

export default UserInviteForm;
