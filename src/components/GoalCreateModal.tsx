import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { useRouter } from '../hooks/router';
import { createHotkeys, createGoalKeys } from '../utils/hotkeys';
import { ModalEvent } from '../utils/dispatchModal';

import { Modal } from './Modal';
import { GoalCreateForm } from './GoalCreateForm';

const GoalCreateModal = () => {
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([createGoalKeys, () => setModalVisibility(true)])), []);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener(ModalEvent.GoalCreateModal, globalListener);

        return () => {
            window.removeEventListener(ModalEvent.GoalCreateModal, globalListener);
        };
    }, []);

    const onFormSubmit = useCallback(
        (id?: string) => {
            id && router.goal(id);
        },
        [router],
    );

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <GoalCreateForm onSubmit={onFormSubmit} />
        </Modal>
    );
};

export default GoalCreateModal;
