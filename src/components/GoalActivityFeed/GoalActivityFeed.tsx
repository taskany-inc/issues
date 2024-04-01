import { nullable } from '@taskany/bricks';
import { forwardRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { editGoalKeys } from '../../utils/hotkeys';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { usePageContext } from '../../hooks/usePageContext';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { CommentView } from '../CommentView/CommentView';
import { GoalActivity } from '../GoalActivity';
import { GoalCriteriaView, mapCriteria } from '../GoalCriteria/GoalCriteria';
import { AddInlineTrigger } from '../AddInlineTrigger';
import { GoalCriteriaSuggest } from '../GoalCriteriaSuggest';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger/GoalFormPopupTrigger';

import { tr } from './GoalActivityFeed.i18n';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));
const GoalCommentCreateForm = dynamic(() => import('../GoalCommentCreateForm'));

interface GoalActivityFeedProps {
    goal: NonNullable<GoalByIdReturnType>;
    shortId?: string;

    onGoalDeleteConfirm?: () => void;
    onInvalidate?: () => void;
}

export const GoalActivityFeed = forwardRef<HTMLDivElement, GoalActivityFeedProps>(
    ({ goal, shortId, onGoalDeleteConfirm, onInvalidate }, ref) => {
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
            async (data: { title: string; weight: string; selected?: { id?: string } }) => {
                await onGoalCriteriaAdd({
                    title: data.title,
                    weight: String(data.weight),
                    goalId: goal.id,
                    criteriaGoal: data.selected?.id
                        ? {
                              id: data.selected.id,
                          }
                        : undefined,
                });
            },
            [goal.id, onGoalCriteriaAdd],
        );

        const handleUpdateCriteria = useCallback(
            async (data: { id?: string; title: string; weight?: number; criteriaGoal?: { id?: string } }) => {
                if (!data.id) return;

                await onGoalCriteriaUpdate({
                    id: data.id,
                    title: data.title,
                    weight: String(data.weight),
                    goalId: goal.id,
                    criteriaGoal: data.criteriaGoal?.id
                        ? {
                              id: data.criteriaGoal.id,
                          }
                        : undefined,
                });
            },
            [goal.id, onGoalCriteriaUpdate],
        );

        const handleRemoveCriteria = useCallback(
            async (data: { id: string }) => {
                await onGoalCriteriaRemove({
                    id: data.id,
                    goalId: goal.id,
                });
            },
            [goal.id, onGoalCriteriaRemove],
        );

        const handleUpdateCriteriaState = useCallback(
            async (data: { id: string; isDone: boolean }) => {
                await onGoalCriteriaToggle({
                    id: data.id,
                    isDone: data.isDone,
                });
            },
            [onGoalCriteriaToggle],
        );

        const handleConvertCriteriaToGoal = useCallback(
            async (data: { id: string; title: string }) => {
                onGoalCriteriaConvert({
                    id: data.id,
                    title: data.title,
                });
            },
            [onGoalCriteriaConvert],
        );

        return (
            <>
                <GoalActivity
                    ref={ref}
                    feed={goal._activityFeed}
                    header={
                        <>
                            {nullable(goal._criteria?.length || goal._isEditable, () => (
                                <GoalCriteriaView
                                    goalId={goal.id}
                                    canEdit={goal._isEditable}
                                    onUpdate={handleUpdateCriteria}
                                    onCheck={handleUpdateCriteriaState}
                                    onConvert={handleConvertCriteriaToGoal}
                                    onRemove={handleRemoveCriteria}
                                    list={goal._criteria?.map((criteria) =>
                                        mapCriteria(criteria, criteria.criteriaGoal),
                                    )}
                                >
                                    {nullable(goal._isEditable, () => (
                                        <GoalFormPopupTrigger
                                            renderTrigger={(props) => (
                                                <AddInlineTrigger
                                                    text={tr('Add achievement criteria')}
                                                    ref={props.ref}
                                                    onClick={props.onClick}
                                                    centered={false}
                                                />
                                            )}
                                        >
                                            <GoalCriteriaSuggest
                                                id={goal.id}
                                                withModeSwitch
                                                defaultMode="simple"
                                                items={goal._criteria.map((criteria) => ({
                                                    ...criteria,
                                                    goal: criteria.criteriaGoal,
                                                }))}
                                                onSubmit={handleCreateCriteria}
                                                validateGoalCriteriaBindings={validateGoalCriteriaBindings}
                                            />
                                        </GoalFormPopupTrigger>
                                    ))}
                                </GoalCriteriaView>
                            ))}
                            {nullable(lastStateComment, (value) => (
                                <CommentView
                                    pin
                                    id={value.id}
                                    author={value.author}
                                    description={value.description}
                                    hue={value.hue}
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
                            states={goal._isEditable || goal._isParticipant ? goal.project?.flow.states : undefined}
                            onSubmit={onGoalCommentCreate}
                        />
                    }
                    renderCommentItem={(value) => (
                        <CommentView
                            id={value.id}
                            author={value.author}
                            description={value.description}
                            hue={value.hue}
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
