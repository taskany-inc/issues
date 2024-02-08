import React, { useCallback, useState, useRef } from 'react';
import z from 'zod';
import { FieldError } from 'react-hook-form';
import styled from 'styled-components';
import { gapM, gapS, gray7 } from '@taskany/colors';
import {
    Text,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    ModalHeader,
    ModalContent,
    Tag,
    KeyCode,
    TagCleanButton,
    Keyboard,
    nullable,
} from '@taskany/bricks';
import { Button, FormControl, FormControlInput, FormControlError } from '@taskany/bricks/harmony';

import { trpc } from '../../utils/trpcClient';
import { notifyPromise } from '../../utils/notifyPromise';
import { HelpButton } from '../HelpButton/HelpButton';
import { TagsList } from '../TagsList';
import RotatableTip from '../RotatableTip/RotatableTip';

import { tr } from './UserInviteForm.i18n';

const StyledTagsList = styled(TagsList)`
    padding: ${gapM} 0;
`;

const StyledFormBottom = styled.div`
    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    padding: ${gapS} ${gapS} 0 ${gapS};
`;

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
            <ModalHeader>
                <FormTitle>{tr('Invite new users')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <StyledTagsList>
                    {nullable(
                        isValid,
                        () =>
                            emails.map((email) => (
                                <Tag key={email}>
                                    <TagCleanButton onClick={onEmailRemove(email)} />
                                    {email}
                                </Tag>
                            )),
                        <Text size="s" color={gray7}>
                            {tr.raw('Start typing users emails', {
                                key1: <Keyboard enter />,
                                key2: <Keyboard space />,
                            })}
                        </Text>,
                    )}
                </StyledTagsList>

                <Form>
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

                    <FormActions flat="top">
                        <FormAction left />
                        <FormAction right inline>
                            <Button
                                view="primary"
                                type="submit"
                                disabled={!isValid}
                                text={tr('Send invites')}
                                onClick={inviteUser}
                            />
                        </FormAction>
                    </FormActions>
                </Form>

                <StyledFormBottom>
                    <RotatableTip context="invites" />

                    <HelpButton slug="users" />
                </StyledFormBottom>
            </ModalContent>
        </>
    );
};

export default UserInviteForm;
