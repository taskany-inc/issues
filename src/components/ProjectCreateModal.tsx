import { useCallback, useEffect, useState } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import tinykeys from 'tinykeys';

import { routes, useRouter } from '../hooks/router';
import { createProjectKeys, createHotkeys } from '../utils/hotkeys';

import { Modal } from './Modal';
import { ProjectCreateForm } from './ProjectCreateForm';

const ProjectCreateModal = () => {
    const nextRouter = useNextRouter();
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const isCreateProjectPath = nextRouter.pathname === routes.createProject();
    const showModalOrNavigate = useCallback(
        (navigate: () => void) => (isCreateProjectPath ? navigate() : setModalVisibility(true)),
        [isCreateProjectPath],
    );
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(
        () => tinykeys(window, createHotkeys([createProjectKeys, () => showModalOrNavigate(router.createProject)])),
        [router.createProject, showModalOrNavigate],
    );

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <ProjectCreateForm onCreate={(key) => key && router.project(key)} />
        </Modal>
    );
};

export default ProjectCreateModal;
