import { useRef } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { nullable, useOfflineDetector } from '@taskany/bricks';
import { OfflineBanner as OfflineBannerBricks } from '@taskany/bricks/harmony';

import { tr } from './OfflineBanner.i18n';

export const OfflineBanner = () => {
    const isOnline = useRef<boolean | null>(true);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, remoteServerStatus] = useOfflineDetector({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setStatus: ([_global, remote]) => {
            if (isOnline.current !== remote) {
                isOnline.current = remote;
                onlineManager.setOnline(remote);
            }
        },
        remoteServerUrl: '/api/health',
    });

    return nullable(!remoteServerStatus, () => (
        <OfflineBannerBricks text={tr('You are currently offline. Check connection.')} />
    ));
};

export default OfflineBanner;
