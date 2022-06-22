import { useCallback, useEffect, useState } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import tinykeys from 'tinykeys';

import { routes, useRouter } from '../hooks/router';
import { createHotkeys, inviteUserKeys } from '../utils/hotkeys';

import { Modal } from './Modal';
import { UserInviteForm } from './UserInviteForm';

const UserInviteModal = () => {
    const nextRouter = useNextRouter();
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const isInviteUsersPath = nextRouter.pathname === routes.inviteUsers();
    const showModalOrNavigate = useCallback(
        (navigate: () => void) => (isInviteUsersPath ? navigate() : setModalVisibility(true)),
        [isInviteUsersPath],
    );
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(
        () => tinykeys(window, createHotkeys([inviteUserKeys, () => showModalOrNavigate(router.inviteUsers)])),
        [router.inviteUsers, showModalOrNavigate],
    );

    return (
        <Modal visible={modalVisible} onClose={onModalClose}>
            <UserInviteForm onCreate={() => setModalVisibility(false)} />
        </Modal>
    );
};

export default UserInviteModal;
