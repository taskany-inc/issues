import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { useRouter } from '../hooks/router';
import { ModalEvent } from '../utils/dispatchModal';
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
        window.addEventListener(ModalEvent.ProjectCreateModal, globalListener);

        return () => {
            window.removeEventListener(ModalEvent.ProjectCreateModal, globalListener);
        };
    }, []);

    const onFormSubmit = useCallback(
        (key?: string) => {
            key && router.project(key);
        },
        [router],
    );

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <ProjectCreateForm onCreate={onFormSubmit} />
        </Modal>
    );
};

export default ProjectCreateModal;
