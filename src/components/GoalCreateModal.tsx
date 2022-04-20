import { useCallback, useEffect, useState } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import tinykeys from 'tinykeys';

import { routes, useRouter } from '../hooks/router';
import { createHotkeys, createGoalKeys } from '../utils/hotkeys';
import { DialogModal } from './DialogModal';
import { GoalCreateForm } from './GoalCreateForm';

export const GoalCreateModal = () => {
    const nextRouter = useNextRouter();
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const isCreateGoalPath = nextRouter.pathname === routes.createGoal();
    const showModalOrNavigate = (navigate: () => void) => (isCreateGoalPath ? navigate() : setModalVisibility(true));
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([createGoalKeys, () => showModalOrNavigate(router.createGoal)])));

    return (
        <DialogModal visible={modalVisible} onClose={onModalClose}>
            <GoalCreateForm onCreate={(slug) => slug && router.goal(slug)} />
        </DialogModal>
    );
};
