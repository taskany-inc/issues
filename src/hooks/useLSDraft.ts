import { useCallback } from 'react';

import { DraftGoalComment, useLocalStorage } from './useLocalStorage';

type LSParams = Parameters<typeof useLocalStorage>;

type DraftComment = DraftGoalComment[keyof DraftGoalComment];
type DraftGoalCommentKey = 'draftGoalComment';

function useLSDraft<KDG extends DraftGoalCommentKey>(storageKey: KDG, initialValue: Record<string, LSParams[1]>) {
    const [, setDraft, draftRef] = useLocalStorage(storageKey, initialValue);

    const saveDraft = useCallback(
        (id: string, draft: DraftComment) => {
            setDraft((prev) => ({
                ...prev,
                [id]: draft,
            }));
        },
        [setDraft],
    );

    const resolveDraft = useCallback((id?: string) => (id ? draftRef.current[id] : undefined), [draftRef]);

    const removeDraft = useCallback(
        (id: string) => {
            setDraft((prev) => {
                if (prev[id]) {
                    delete prev[id];
                    return { ...prev };
                }
                return prev;
            });
        },
        [setDraft],
    );

    return {
        saveDraft,
        resolveDraft,
        removeDraft,
    };
}

export { useLSDraft };
