import { useCallback, useEffect, useState } from 'react';
import { useRouter as useNextRouter } from 'next/router';
import tinykeys from 'tinykeys';

import { routes, useRouter } from '../hooks/router';
import { createHotkeys, inviteUserKeys } from '../utils/hotkeys';
import { DialogModal } from './DialogModal';
import { UserInviteForm } from './UserInviteForm';

export const UserInviteModal = () => {
    const nextRouter = useNextRouter();
    const router = useRouter();
    const [modalVisible, setModalVisibility] = useState(false);
    const isInviteUsersPath = nextRouter.pathname === routes.inviteUsers();
    const showModalOrNavigate = (navigate: () => void) => (isInviteUsersPath ? navigate() : setModalVisibility(true));
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([inviteUserKeys, () => showModalOrNavigate(router.inviteUsers)])));

    return (
        <DialogModal visible={modalVisible} onClose={onModalClose}>
            <UserInviteForm onCreate={() => setModalVisibility(false)} />
        </DialogModal>
    );
};
