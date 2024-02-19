import { onlineManager } from '@tanstack/react-query';
import { nullable, useOfflineDetector } from '@taskany/bricks';
import { OfflineBanner as OfflineBannerBricks } from '@taskany/bricks/harmony';

import { tr } from './OfflineBanner.i18n';

export const OfflineBanner = () => {
    const [globalOnlineStatus, remoteServerStatus] = useOfflineDetector({
        setStatus: () => {
            onlineManager.setOnline(globalOnlineStatus || remoteServerStatus);
        },
        remoteServerUrl: '/api/health',
    });
    return nullable(!globalOnlineStatus || !remoteServerStatus, () => (
        <OfflineBannerBricks text={tr('You are currently offline. Check connection.')} />
    ));
};
