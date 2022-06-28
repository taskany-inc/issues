import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { ModalEvent } from '../utils/dispatchModal';
import { createHotkeys, inviteUserKeys } from '../utils/hotkeys';

import { Modal } from './Modal';
import { UserInviteForm } from './UserInviteForm';

const UserInviteModal = () => {
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([inviteUserKeys, () => setModalVisibility(true)])), []);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener(ModalEvent.UserInviteModal, globalListener);

        return () => {
            window.removeEventListener(ModalEvent.UserInviteModal, globalListener);
        };
    }, []);

    const onFormSubmit = useCallback(() => {
        setModalVisibility(false);
    }, []);

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <UserInviteForm onCreate={onFormSubmit} />
        </Modal>
    );
};

export default UserInviteModal;
