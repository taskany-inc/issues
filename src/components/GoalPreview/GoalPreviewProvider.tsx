import React, { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { refreshInterval } from '../../utils/config';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';

type ContextType = {
    shortId: string | null;
    preview: GoalByIdReturnType | null;
    defaults: Partial<GoalByIdReturnType> | null;
    setPreview: (shortId: string | null, defaults?: Partial<GoalByIdReturnType>) => void;
};

const GoalPreviewProviderContext = createContext<ContextType>({
    shortId: null,
    preview: null,
    defaults: null,
    setPreview: () => {},
});

export const useGoalPreview = () => {
    return useContext(GoalPreviewProviderContext);
};

export const GoalPreviewProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [shortId, setPreviewId] = useState<string | null>(null);
    const [defaults, setDefaults] = useState<Partial<GoalByIdReturnType> | null>(null);

    const { data: preview = null } = trpc.goal.getById.useQuery(shortId as string, {
        staleTime: refreshInterval,
        enabled: !!shortId,
    });

    const setPreview = useCallback((shortId: string | null, defaults: Partial<GoalByIdReturnType> = {}) => {
        setPreviewId(shortId);
        setDefaults(shortId ? defaults : null);
    }, []);

    const value = useMemo(
        () => ({ shortId, preview: shortId ? preview : null, defaults: shortId ? defaults : null, setPreview }),
        [shortId, preview, defaults, setPreview],
    );

    return <GoalPreviewProviderContext.Provider value={value}>{children}</GoalPreviewProviderContext.Provider>;
};
