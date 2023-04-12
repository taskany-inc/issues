import React, { ChangeEvent, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
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

import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';

const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));

interface GoalDeleteModalProps {
    id: string;

    onConfirm: () => void;
    onCancel?: () => void;
}

export const GoalDeleteModal: React.FC<GoalDeleteModalProps> = ({ id, onConfirm, onCancel }) => {
    const t = useTranslations('GoalDeleteModal');

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
                <FormTitle color={danger0}>{t('You are trying to delete goal')}</FormTitle>
            </ModalHeader>

            <ModalContent>
                <Text>
                    {t.rich('To confirm deleting goal please type goal key below', {
                        goal: () => <b>{id}</b>,
                    })}
                </Text>

                <br />

                <Form>
                    <FormInput flat="bottom" placeholder={id} autoComplete="off" onChange={onConfirmationInputChange} />

                    <FormActions flat="top">
                        <FormAction left />
                        <FormAction right inline>
                            <Button size="m" text={t('Cancel')} onClick={onDeleteCancel} />
                            <Button
                                size="m"
                                view="danger"
                                disabled={deleteConfirmation !== id}
                                onClick={onConfirm}
                                text={t('Yes, delete it')}
                            />
                        </FormAction>
                    </FormActions>
                </Form>
            </ModalContent>
        </ModalOnEvent>
    );
};
