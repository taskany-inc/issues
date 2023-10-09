import { ComponentProps, FC, useCallback } from 'react';
import type { Comment } from '@prisma/client';

import { useLSDraft } from '../hooks/useLSDraft';

import CommentCreateForm from './CommentCreateForm/CommentCreateForm';

interface GoalCommentCreateFormProps {
    states: ComponentProps<typeof CommentCreateForm>['states'];
    goalId: string;
    onSubmit: (comment?: { description: string; stateId?: string }) => Promise<Comment | null | undefined>;
}

const GoalCommentCreateForm: FC<GoalCommentCreateFormProps> = ({ states, goalId, onSubmit }) => {
    const {
        saveDraft: saveGoalCommentDraft,
        resolveDraft: resolveGoalCommentDraft,
        removeDraft: removeGoalCommentDraft,
    } = useLSDraft('draftGoalComment', {});

    const onGoalCommentChange = useCallback(
        (comment?: { stateId?: string; description?: string }) => {
            if (!comment?.description) {
                removeGoalCommentDraft(goalId);
                return;
            }

            saveGoalCommentDraft(goalId, comment);
        },
        [goalId, removeGoalCommentDraft, saveGoalCommentDraft],
    );

    const onGoalCommentCancel = useCallback(() => {
        removeGoalCommentDraft(goalId);
    }, [goalId, removeGoalCommentDraft]);

    const commentDraft = resolveGoalCommentDraft(goalId);

    const onGoalCommentSubmit = useCallback(
        async (comment?: { description: string; stateId?: string }) => {
            const data = await onSubmit(comment);
            if (data) {
                removeGoalCommentDraft(goalId);
            }
        },
        [goalId, onSubmit, removeGoalCommentDraft],
    );

    return (
        <CommentCreateForm
            states={states}
            stateId={commentDraft?.stateId}
            description={commentDraft?.description}
            onSubmit={onGoalCommentSubmit}
            onCancel={onGoalCommentCancel}
            onChange={onGoalCommentChange}
        />
    );
};

export default GoalCommentCreateForm;
