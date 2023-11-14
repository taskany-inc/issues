import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { danger0 } from '@taskany/colors';
import {
    Button,
    Text,
    Form,
    FormAction,
    FormActions,
    FormTitle,
    ModalContent,
    ModalHeader,
    FormControl,
    FormControlInput,
} from '@taskany/bricks';

import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';
import { goalDeleteForm, goalDeleteShortIdInput, goalDeleteSubmitButton } from '../../utils/domObjects';

import { tr } from './GoalDeleteModal.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

interface GoalDeleteModalProps {
    shortId: string;

    onConfirm: () => void;
    onCancel?: () => void;
}

export const GoalDeleteModal: React.FC<GoalDeleteModalProps> = ({ shortId, onConfirm, onCancel }) => {
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    // FIXME: try to find better way to solve this issue with autoFocus
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const globalListener = () => {
            setTimeout(() => ref.current && ref.current.focus(), 0);
        };

        window.addEventListener(ModalEvent.GoalDeleteModal, globalListener);

        return () => {
            window.removeEventListener(ModalEvent.GoalDeleteModal, globalListener);
        };
    });

    const onConfirmationInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDeleteConfirmation(e.currentTarget.value);
    }, []);

    const onDeleteCancel = useCallback(() => {
        setDeleteConfirmation('');
        onCancel?.();
        dispatchModalEvent(ModalEvent.GoalDeleteModal)();
    }, [onCancel]);

    return (
        <ModalOnEvent view="danger" event={ModalEvent.GoalDeleteModal}>
            <ModalHeader>
                <FormTitle color={danger0}>{tr('You are trying to archive goal')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Text>
                    {tr.raw('To confirm archiving goal please type goal key below', {
                        goal: <b key={shortId}>{shortId}</b>,
                    })}
                </Text>

                <br />

                <Form {...goalDeleteForm.attr}>
                    <FormControl flat="bottom" size="l">
                        <FormControlInput
                            placeholder={shortId}
                            autoComplete="off"
                            autoFocus
                            onChange={onConfirmationInputChange}
                            ref={ref}
                            {...goalDeleteShortIdInput.attr}
                        />
                    </FormControl>

                    <FormActions flat="top">
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('Cancel')} onClick={onDeleteCancel} />
                            <Button
                                size="m"
                                view="danger"
                                disabled={deleteConfirmation !== shortId}
                                onClick={onConfirm}
                                text={tr('Yes, archive it')}
                                {...goalDeleteSubmitButton.attr}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </ModalOnEvent>
    );
};
