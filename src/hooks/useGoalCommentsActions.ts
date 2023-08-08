import { useCallback, useMemo } from 'react';

import { trpc } from '../utils/trpcClient';
import { GoalByIdReturnType } from '../../trpc/inferredTypes';

import { useLSDraft } from './useLSDraft';
import { useHighlightedComment } from './useHighlightedComment';
import { useCommentResource } from './useCommentResource';
import { useReactionsResource } from './useReactionsResource';

export const useGoalCommentsActions = ({
    id,
    shortId,
    stateId,
    reactions,
    comments,
    cb,
}: {
    id?: string;
    shortId?: string;
    stateId?: string | null;
    reactions?: NonNullable<GoalByIdReturnType>['reactions'];
    comments?: NonNullable<GoalByIdReturnType>['comments'];
    cb: () => void;
}) => {
    const {
        saveDraft: saveCommentDraft,
        resolveDraft: resolveCommentDraft,
        removeDraft: removeCommentDraft,
    } = useLSDraft('draftGoalComment', {});
    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const { create: createComment, update: updateComment, remove: removeComment } = useCommentResource();
    const { commentReaction } = useReactionsResource(reactions);

    const utils = trpc.useContext();

    const onCommentChange = useCallback(
        (comment?: { stateId?: string; description?: string }) => {
            if (id) {
                if (!comment?.description) {
                    removeCommentDraft(id);
                    return;
                }

                saveCommentDraft(id, comment);
            }
        },
        [id, removeCommentDraft, saveCommentDraft],
    );

    const onCommentCreate = useCallback(
        async (comment?: { description: string; stateId?: string }) => {
            if (comment && id) {
                await createComment(({ id }) => {
                    cb();
                    removeCommentDraft(id);
                    setHighlightCommentId(id);
                })({
                    ...comment,
                    goalId: id,
                });
            }
        },
        [id, cb, removeCommentDraft, setHighlightCommentId, createComment],
    );

    const onCommentUpdate = useCallback(
        (commentId: string) => async (comment?: { description: string }) => {
            if (comment && commentId) {
                await updateComment(() => {
                    cb();
                })({
                    ...comment,
                    id: commentId,
                });
            }
        },
        [cb, updateComment],
    );

    const onCommentCancel = useCallback(() => {
        if (id) {
            removeCommentDraft(id);
        }
    }, [removeCommentDraft, id]);

    const onCommentReactionToggle = useCallback(
        (id: string) => commentReaction(id, () => utils.goal.getById.invalidate(shortId)),
        [shortId, commentReaction, utils.goal.getById],
    );

    const onCommentDelete = useCallback(
        (id: string) => () => {
            removeComment(() => {
                cb();
            })({ id });
        },
        [cb, removeComment],
    );

    const lastStateComment = useMemo(() => {
        if ((comments?.length ?? 0) <= 1) {
            return null;
        }

        const foundResult = comments?.findLast((comment) => comment.stateId);
        return foundResult?.stateId === stateId ? foundResult : null;
    }, [comments, stateId]);

    return {
        highlightCommentId,
        lastStateComment,
        resolveCommentDraft,
        onCommentChange,
        onCommentCreate,
        onCommentUpdate,
        onCommentDelete,
        onCommentCancel,
        onCommentReactionToggle,
    };
};
