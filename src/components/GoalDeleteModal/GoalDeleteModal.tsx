import React, { ChangeEvent, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { danger0 } from '@taskany/colors';
import {
    Button,
    Text,
    Form,
    FormInput,
    FormAction,
    FormActions,
    FormTitle,
    ModalContent,
    ModalHeader,
} from '@taskany/bricks';

import { dispatchModalEvent, ModalEvent } from '../../utils/dispatchModal';

import { tr } from './GoalDeleteModal.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));

interface GoalDeleteModalProps {
    shortId: string;

    onConfirm: () => void;
    onCancel?: () => void;
}

export const GoalDeleteModal: React.FC<GoalDeleteModalProps> = ({ shortId, onConfirm, onCancel }) => {
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

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
                <FormTitle color={danger0}>{tr('You are trying to delete goal')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Text>
                    {tr.raw('To confirm deleting goal please type goal key below', {
                        goal: <b key={shortId}>{shortId}</b>,
                    })}
                </Text>

                <br />

                <Form>
                    <FormInput
                        flat="bottom"
                        placeholder={shortId}
                        autoComplete="off"
                        autoFocus
                        onChange={onConfirmationInputChange}
                    />

                    <FormActions flat="top">
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={tr('Cancel')} onClick={onDeleteCancel} />
                            <Button
                                size="m"
                                view="danger"
                                disabled={deleteConfirmation !== shortId}
                                onClick={onConfirm}
                                text={tr('Yes, delete it')}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </ModalOnEvent>
    );
};
