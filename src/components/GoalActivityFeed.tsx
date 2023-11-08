import { nullable } from '@taskany/bricks';
import { ComponentProps, forwardRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';
import { editGoalKeys } from '../utils/hotkeys';
import { GoalByIdReturnType } from '../../trpc/inferredTypes';
import { useGoalResource } from '../hooks/useGoalResource';
import { usePageContext } from '../hooks/usePageContext';

import { GoalDeleteModal } from './GoalDeleteModal/GoalDeleteModal';
import { CommentView } from './CommentView/CommentView';
import { GoalCriteria } from './GoalCriteria/GoalCriteria';
import { GoalActivity } from './GoalActivity';
import { AddCriteriaForm } from './CriteriaForm/CriteriaForm';

const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));
const GoalEditForm = dynamic(() => import('./GoalEditForm/GoalEditForm'));
const GoalCommentCreateForm = dynamic(() => import('./GoalCommentCreateForm'));

interface GoalActivityFeedProps {
    goal: NonNullable<GoalByIdReturnType>;
    shortId?: string;

    onGoalCriteriaClick?: ComponentProps<typeof GoalCriteria>['onClick'];
    onGoalDeleteConfirm?: () => void;
    onInvalidate?: () => void;
}

export const GoalActivityFeed = forwardRef<HTMLDivElement, GoalActivityFeedProps>(
    ({ goal, shortId, onGoalCriteriaClick, onGoalDeleteConfirm, onInvalidate }, ref) => {
        const { user } = usePageContext();
        const {
            onGoalCommentUpdate,
            onGoalDelete,
            onGoalCriteriaAdd,
            onGoalCriteriaToggle,
            onGoalCriteriaUpdate,
            onGoalCriteriaRemove,
            onGoalCriteriaConvert,
            onGoalCommentCreate,
            onGoalCommentReactionToggle,
            onGoalCommentDelete,
            lastStateComment,
            highlightCommentId,
        } = useGoalResource(
            {
                id: goal?.id,
                stateId: goal?.stateId,
                comments: goal?._comments,
            },
            {
                invalidate: {
                    getById: shortId,
                },
                afterInvalidate: onInvalidate,
            },
        );

        const onConfirmDeletingGoal = useCallback(async () => {
            await onGoalDelete();
            onGoalDeleteConfirm?.();
        }, [onGoalDelete, onGoalDeleteConfirm]);

        const onGoalCommentSubmit = useCallback(
            (comment: { activityId: string; id: string }) => {
                return comment.activityId === user?.activityId ? onGoalCommentUpdate(comment.id) : undefined;
            },
            [onGoalCommentUpdate, user?.activityId],
        );

        return (
            <>
                <GoalActivity
                    ref={ref}
                    feed={goal._activityFeed}
                    header={
                        <>
                            {nullable(goal.goalAchiveCriteria.length || goal._isEditable, () => (
                                <GoalCriteria
                                    goalId={goal.id}
                                    criteriaList={goal.goalAchiveCriteria}
                                    onAddCriteria={onGoalCriteriaAdd}
                                    onToggleCriteria={onGoalCriteriaToggle}
                                    onRemoveCriteria={onGoalCriteriaRemove}
                                    onConvertToGoal={onGoalCriteriaConvert}
                                    onUpdateCriteria={onGoalCriteriaUpdate}
                                    onClick={onGoalCriteriaClick}
                                    canEdit={goal._isEditable}
                                    renderTrigger={(props) =>
                                        nullable(goal._isEditable, () => (
                                            <AddCriteriaForm
                                                goalId={props.goalId}
                                                onSubmit={props.onSubmit}
                                                validityData={props.validityData}
                                            />
                                        ))
                                    }
                                />
                            ))}
                            {nullable(lastStateComment, (value) => (
                                <CommentView
                                    pin
                                    id={value.id}
                                    author={value.activity?.user}
                                    description={value.description}
                                    state={value.state}
                                    createdAt={value.createdAt}
                                    reactions={value.reactions}
                                    onSubmit={onGoalCommentSubmit(value)}
                                    onReactionToggle={onGoalCommentReactionToggle(value.id)}
                                    onDelete={onGoalCommentDelete(value.id)}
                                />
                            ))}
                        </>
                    }
                    footer={
                        <GoalCommentCreateForm
                            goalId={goal.id}
                            stateId={goal.stateId}
                            states={goal._isEditable ? goal.project?.flow.states : undefined}
                            onSubmit={onGoalCommentCreate}
                        />
                    }
                    renderCommentItem={(value) => (
                        <CommentView
                            id={value.id}
                            author={value.activity?.user}
                            description={value.description}
                            state={value.state}
                            createdAt={value.createdAt}
                            highlight={value.id === highlightCommentId}
                            reactions={value.reactions}
                            onSubmit={onGoalCommentSubmit(value)}
                            onReactionToggle={onGoalCommentReactionToggle(value.id)}
                            onDelete={onGoalCommentDelete(value.id)}
                        />
                    )}
                />

                {nullable(goal._isEditable, () => (
                    <>
                        <ModalOnEvent event={ModalEvent.GoalEditModal} hotkeys={editGoalKeys}>
                            <GoalEditForm goal={goal} onSubmit={dispatchModalEvent(ModalEvent.GoalEditModal)} />
                        </ModalOnEvent>

                        <GoalDeleteModal shortId={goal._shortId} onConfirm={onConfirmDeletingGoal} />
                    </>
                ))}
            </>
        );
    },
);
