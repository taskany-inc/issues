import React, {
    createContext,
    FC,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { refreshInterval } from '../../utils/config';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { trpc } from '../../utils/trpcClient';
import { ModalEvent, MapModalToComponentProps, dispatchModalEvent } from '../../utils/dispatchModal';
import { useClientEvent } from '../../hooks/useClientEvent';

type GoalPreviewEvent = MapModalToComponentProps['GoalPreviewModal']['type'];

type Unsub = () => void;
type Listener = (id: string) => void;
type Sub = (type: GoalPreviewEvent, cb: Listener) => Unsub;
type GoalPreviewEmitter = {
    [key in GoalPreviewEvent]: Listener[];
};

interface ContextType {
    shortId: string | null;
    preview: GoalByIdReturnType | null;
    defaults: Partial<GoalByIdReturnType> | null;
    setPreview: (shortId: string | null, defaults?: Partial<GoalByIdReturnType>) => void;
    on: Sub;
}

const GoalPreviewProviderContext = createContext<ContextType>({
    shortId: null,
    preview: null,
    defaults: null,
    setPreview: () => {},
    on: () => () => {},
});

export const useGoalPreview = () => {
    return useContext(GoalPreviewProviderContext);
};

export const GoalPreviewProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [shortId, setPreviewId] = useState<string | null>(null);
    const [defaults, setDefaults] = useState<Partial<GoalByIdReturnType> | null>(null);

    const eventsRef = useRef<GoalPreviewEmitter>({
        'on:goal:delete': [],
        'on:goal:update': [],
    });

    const { data: preview = null } = trpc.goal.getById.useQuery(shortId as string, {
        staleTime: refreshInterval,
        enabled: !!shortId,
    });

    const setPreview = useCallback((newShortId: string | null, defaults: Partial<GoalByIdReturnType> = {}) => {
        setPreviewId(newShortId);
        setDefaults(newShortId ? defaults : null);
    }, []);

    useClientEvent(
        'goalPreviewOpen',
        {
            goalId: preview?.id || null,
            scopedId: preview?._shortId || null,
            personal: preview?.personal || null,
        },
        preview == null,
    );

    useEffect(() => {
        const listener = (event: CustomEvent<MapModalToComponentProps[ModalEvent.GoalPreviewModal]>) => {
            if (!shortId) {
                return;
            }
            for (const fn of eventsRef.current[event.detail.type]) {
                fn(shortId);
            }
        };

        window.addEventListener(ModalEvent.GoalPreviewModal, listener);

        return () => {
            window.removeEventListener(ModalEvent.GoalPreviewModal, listener);
        };
    }, [shortId]);

    const subscribe = useCallback<Sub>((type, cb) => {
        eventsRef.current[type].push(cb);
        return () => {
            eventsRef.current[type] = eventsRef.current[type].filter((fn) => fn !== cb);
        };
    }, []);

    const value = useMemo(
        () => ({
            shortId,
            preview: shortId ? preview : null,
            defaults: shortId ? defaults : null,
            setPreview,
            on: subscribe,
        }),
        [shortId, preview, defaults, setPreview, subscribe],
    );

    return <GoalPreviewProviderContext.Provider value={value}>{children}</GoalPreviewProviderContext.Provider>;
};

export const dispatchPreviewUpdateEvent = dispatchModalEvent(ModalEvent.GoalPreviewModal, { type: 'on:goal:update' });
export const dispatchPreviewDeleteEvent = dispatchModalEvent(ModalEvent.GoalPreviewModal, { type: 'on:goal:delete' });
