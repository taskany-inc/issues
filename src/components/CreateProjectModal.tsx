import { useCallback, useEffect, useState } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import tinykeys from 'tinykeys';

import { routes, useRouter } from '../hooks/router';
import { createProjectKeys, createHotkeys } from '../utils/hotkeys';
import { DialogModal } from './DialogModal';
import { CreateProject } from './CreateProject';

export const CreateProjectModal = () => {
    const nextRouter = useNextRouter();
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const isCreateProjectPath = nextRouter.pathname === routes.createProject();
    const showModalOrNavigate = (navigate: () => void) => (isCreateProjectPath ? navigate() : setModalVisibility(true));
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() =>
        tinykeys(window, createHotkeys([createProjectKeys, () => showModalOrNavigate(router.createProject)])),
    );

    return (
        <DialogModal visible={modalVisible} onClose={onModalClose}>
            <CreateProject onCreate={(slug) => slug && router.project(slug)} />
        </DialogModal>
    );
};
