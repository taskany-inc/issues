import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { useRouter } from '../hooks/router';
import { createHotkeys, createGoalKeys } from '../utils/hotkeys';

import { Modal } from './Modal';
import { GoalCreateForm } from './GoalCreateForm';

const GoalCreateModal = () => {
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([createGoalKeys, () => setModalVisibility(true)])), []);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener('GoalCreateModal', globalListener);

        return () => {
            window.removeEventListener('GoalCreateModal', globalListener);
        };
    }, []);

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <GoalCreateForm onCreate={(id) => id && router.goal(id)} />
        </Modal>
    );
};

export default GoalCreateModal;
