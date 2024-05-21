import React, { ChangeEvent, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Form, FormAction, FormActions } from '@taskany/bricks';
import { Text, Button, FormControl, FormControlInput, ModalContent, ModalHeader } from '@taskany/bricks/harmony';

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

    const onConfirmationInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDeleteConfirmation(e.currentTarget.value);
    }, []);

    const onDeleteCancel = useCallback(() => {
        setDeleteConfirmation('');
        onCancel?.();
        dispatchModalEvent(ModalEvent.GoalDeleteModal)();
    }, [onCancel]);

    return (
        <ModalOnEvent event={ModalEvent.GoalDeleteModal}>
            <ModalHeader view="danger">{tr('You are trying to archive goal')}</ModalHeader>

            <ModalContent>
                <Text>
                    {tr.raw('To confirm archiving goal please type goal key below', {
                        goal: <b key={shortId}>{shortId}</b>,
                    })}
                </Text>

                <br />

                <Form {...goalDeleteForm.attr}>
                    <FormControl>
                        <FormControlInput
                            brick="bottom"
                            placeholder={shortId}
                            autoFocus
                            onChange={onConfirmationInputChange}
                            size="m"
                            {...goalDeleteShortIdInput.attr}
                        />
                    </FormControl>

                    <FormActions flat="top">
                        <FormAction left />
                        <FormAction right inline>
                            <Button text={tr('Cancel')} onClick={onDeleteCancel} />
                            <Button
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
