import { FC, useCallback } from 'react';
import { Avatar } from '@taskany/bricks/harmony';

import { usePageContext } from '../hooks/usePageContext';
import { useRouter } from '../hooks/router';

export const PageUserMenu: FC = () => {
    const { userSettings, signIn } = useRouter();
    const { user } = usePageContext();
    const onUserMenuClick = useCallback(() => (user ? userSettings() : signIn()), [user, userSettings, signIn]);

    return <Avatar onClick={onUserMenuClick} src={user?.image} email={user?.email} name={user?.name} size="m" />;
};
