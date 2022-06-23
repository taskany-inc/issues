import { useCallback, useEffect, useState } from 'react';
import tinykeys from 'tinykeys';

import { createHotkeys, inviteUserKeys } from '../utils/hotkeys';

import { Modal } from './Modal';
import { UserInviteForm } from './UserInviteForm';

const UserInviteModal = () => {
    const [modalVisible, setModalVisibility] = useState(false);
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([inviteUserKeys, () => setModalVisibility(true)])), []);

    const globalListener = () => setModalVisibility(true);
    useEffect(() => {
        window.addEventListener('UserInviteModal', globalListener);

        return () => {
            window.removeEventListener('UserInviteModal', globalListener);
        };
    }, []);

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <UserInviteForm onCreate={() => setModalVisibility(false)} />
        </Modal>
    );
};

export default UserInviteModal;
