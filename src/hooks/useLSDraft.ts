import { useCallback } from 'react';

import { DraftGoalComment, useLocalStorage } from './useLocalStorage';

type LSParams = Parameters<typeof useLocalStorage>;

type DraftComment = DraftGoalComment[keyof DraftGoalComment];
type DraftGoalCommentKey = 'draftGoalComment';
type DraftGoalCommentKeyReturn = {
    saveDraft: (id: string, draft: DraftComment) => void;
    resolveDraft: (id: string) => DraftComment;
    removeDraft: (id: string) => void;
};

function useLSDraft(
    storageKey: DraftGoalCommentKey,
    initialValue: Record<string, DraftComment>,
): DraftGoalCommentKeyReturn;

/**
 * before using, you need to set up an overload
 */
function useLSDraft<KDG extends DraftGoalCommentKey>(
    storageKey: KDG,
    initialValue: Record<string, LSParams[1]>,
): DraftGoalCommentKeyReturn {
    const [draft, setDraft] = useLocalStorage(storageKey, initialValue);

    const saveDraft = useCallback(
        (id: string, draft: DraftComment) => {
            setDraft((prev) => {
                // @ts-expect-error
                prev[id] = draft;
                return prev;
            });
        },
        [setDraft],
    );

    const resolveDraft = useCallback(
        (id: string) => {
            return draft[id];
        },
        [draft],
    );

    const removeDraft = useCallback(
        (id: string) => {
            setDraft((prev) => {
                delete prev[id];
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
