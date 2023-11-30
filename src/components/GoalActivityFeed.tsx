import { nullable } from '@taskany/bricks';
import { forwardRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';
import { editGoalKeys } from '../utils/hotkeys';
import { GoalAchiveCriteria, GoalByIdReturnType } from '../../trpc/inferredTypes';
import { useGoalResource } from '../hooks/useGoalResource';
import { usePageContext } from '../hooks/usePageContext';
import { routes } from '../hooks/router';

import { GoalDeleteModal } from './GoalDeleteModal/GoalDeleteModal';
import { CommentView } from './CommentView/CommentView';
import { GoalCriteria } from './GoalCriteria/GoalCriteria';
import { GoalActivity } from './GoalActivity';

const ModalOnEvent = dynamic(() => import('./ModalOnEvent'));
const GoalEditForm = dynamic(() => import('./GoalEditForm/GoalEditForm'));
const GoalCommentCreateForm = dynamic(() => import('./GoalCommentCreateForm'));

interface GoalActivityFeedProps {
    goal: NonNullable<GoalByIdReturnType>;
    shortId?: string;

    onGoalCriteriaClick?: (item: GoalAchiveCriteria) => void;
    onGoalDeleteConfirm?: () => void;
    onInvalidate?: () => void;
}

type CriteriaActionData = Parameters<
    Required<React.ComponentProps<typeof GoalCriteria>>['onClick' | 'onConvertToGoal' | 'onRemove' | 'onUpdateState']
>[0];

type CriteriaActionFormData = Parameters<
    Required<React.ComponentProps<typeof GoalCriteria>>['onCreate' | 'onUpdate']
>[0];

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
            validateGoalCriteriaBindings,
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

        const handleCreateCriteria = useCallback(
            async (data: Required<CriteriaActionFormData>) => {
                await onGoalCriteriaAdd({
                    title: data.title,
                    weight: String(data.weight),
                    goalId: goal.id,
                    criteriaGoal:
                        'selected' in data && data.selected != null
                            ? {
                                  id: data.selected.id,
                              }
                            : undefined,
                });
            },
            [goal.id, onGoalCriteriaAdd],
        );
        const handleUpdateCriteria = useCallback(
            async (data: Required<CriteriaActionFormData>) => {
                await onGoalCriteriaUpdate({
                    id: data.id,
                    title: data.title,
                    weight: String(data.weight),
                    goalId: goal.id,
                    criteriaGoal:
                        'selected' in data && data.selected != null && data.selected.id != null
                            ? {
                                  id: data.selected.id,
                              }
                            : undefined,
                });
            },
            [goal.id, onGoalCriteriaUpdate],
        );
        const handleRemoveCriteria = useCallback(
            async (data: CriteriaActionData) => {
                await onGoalCriteriaRemove({
                    id: data.id,
                    goalId: goal.id,
                });
            },
            [goal.id, onGoalCriteriaRemove],
        );
        const handleUpdateCriteriaState = useCallback(
            async (data: CriteriaActionData) => {
                await onGoalCriteriaToggle({
                    id: data.id,
                    isDone: data.isDone,
                });
            },
            [onGoalCriteriaToggle],
        );
        const handleConvertCriteriaToGoal = useCallback(
            async (data: CriteriaActionData) => {
                onGoalCriteriaConvert({
                    id: data.id,
                    title: data.title,
                });
            },
            [onGoalCriteriaConvert],
        );

        const handleValidateGoalToCriteriaBinging = useCallback(
            (selectedId: string) => {
                return validateGoalCriteriaBindings({ criteriaGoalId: selectedId, goalId: goal.id });
            },
            [goal.id, validateGoalCriteriaBindings],
        );

        const handleGoalClick = useCallback(
            (data: CriteriaActionData) => {
                const targetCriteria = goal.goalAchiveCriteria.find(({ id }) => id === data.id);

                if (targetCriteria != null) {
                    onGoalCriteriaClick?.(targetCriteria);
                }
            },
            [goal.goalAchiveCriteria, onGoalCriteriaClick],
        );

        const criteriaList = useMemo(() => {
            if (goal._criteria?.length) {
                return goal._criteria.map((criteria) => ({
                    id: criteria.id,
                    title: criteria.title,
                    weight: criteria.weight,
                    criteriaGoal:
                        criteria.criteriaGoal != null
                            ? {
                                  id: criteria.criteriaGoal.id,
                                  title: criteria.criteriaGoal.title,
                                  stateColor: criteria.criteriaGoal.state?.hue || 0,
                                  href: routes.goal(criteria.criteriaGoal._shortId),
                              }
                            : null,
                    isDone: criteria.isDone,
                }));
            }

            return [];
        }, [goal._criteria]);

        return (
            <>
                <GoalActivity
                    ref={ref}
                    feed={goal._activityFeed}
                    header={
                        <>
                            {nullable(criteriaList?.length || goal._isEditable, () => (
                                <GoalCriteria
                                    canEdit={goal._isEditable}
                                    onCreate={handleCreateCriteria}
                                    onUpdate={handleUpdateCriteria}
                                    onUpdateState={handleUpdateCriteriaState}
                                    onConvertToGoal={handleConvertCriteriaToGoal}
                                    onRemove={handleRemoveCriteria}
                                    onGoalClick={handleGoalClick}
                                    validateGoalCriteriaBindings={handleValidateGoalToCriteriaBinging}
                                    list={criteriaList}
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
