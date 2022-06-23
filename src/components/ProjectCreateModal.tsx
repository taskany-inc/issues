import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { useRouter } from '../hooks/router';
import { createProjectKeys, createHotkeys } from '../utils/hotkeys';

import { Modal } from './Modal';
import { ProjectCreateForm } from './ProjectCreateForm';

const ProjectCreateModal = () => {
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([createProjectKeys, () => setModalVisibility(true)])), []);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener('ProjectCreateModal', globalListener);

        return () => {
            window.removeEventListener('ProjectCreateModal', globalListener);
        };
    }, []);

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <ProjectCreateForm onCreate={(key) => key && router.project(key)} />
        </Modal>
    );
};

export default ProjectCreateModal;
