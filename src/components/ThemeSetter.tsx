import { useTheme } from 'next-themes';
import { ReactNode, useEffect } from 'react';

import { trpc } from '../utils/trpcClient';

export const ThemeSetter = ({ children }: { children: ReactNode }) => {
    const updateSettingsMutation = trpc.user.updateSettings.useMutation();
    const { resolvedTheme, theme } = useTheme();

    useEffect(() => {
        if (theme !== 'system' || resolvedTheme === 'system') return;
        updateSettingsMutation.mutateAsync({ theme: resolvedTheme });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resolvedTheme]);

    return children;
};
