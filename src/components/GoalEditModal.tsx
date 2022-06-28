import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { createHotkeys, editGoalKeys } from '../utils/hotkeys';
import { ModalEvent } from '../utils/dispatchModal';

import { Modal } from './Modal';
import { GoalEditForm } from './GoalEditForm';

interface GoalEditModalProps {
    goal: React.ComponentProps<typeof GoalEditForm>['goal'];
    onSubmit?: (id: string) => void;
}

const GoalEditModal = ({ goal, onSubmit }: GoalEditModalProps) => {
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([editGoalKeys, () => setModalVisibility(true)])), []);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener(ModalEvent.GoalEditModal, globalListener);

        return () => {
            window.removeEventListener(ModalEvent.GoalEditModal, globalListener);
        };
    }, []);

    const onFormSubmit = useCallback(
        (id?: string) => {
            if (id) {
                setModalVisibility(false);
                onSubmit && onSubmit(id);
            }
        },
        [onSubmit],
    );

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <GoalEditForm goal={goal} onSubmit={onFormSubmit} />
        </Modal>
    );
};

export default GoalEditModal;
