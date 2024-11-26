import { nullable } from '@taskany/bricks';
import { forwardRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

import { trpc } from '../../utils/trpcClient';
import { ModalEvent, dispatchModalEvent } from '../../utils/dispatchModal';
import { editGoalKeys } from '../../utils/hotkeys';
import { GoalByIdReturnType } from '../../../trpc/inferredTypes';
import { useGoalResource } from '../../hooks/useGoalResource';
import { usePageContext } from '../../hooks/usePageContext';
import { GoalDeleteModal } from '../GoalDeleteModal/GoalDeleteModal';
import { CommentView } from '../CommentView/CommentView';
import { GoalCriteriaView, mapCriteria } from '../GoalCriteria/GoalCriteria';
import { AddInlineTrigger } from '../AddInlineTrigger/AddInlineTrigger';
import { GoalCriteriaSuggest } from '../GoalCriteriaSuggest';
import { GoalFormPopupTrigger } from '../GoalFormPopupTrigger/GoalFormPopupTrigger';
import { GoalActivityWithTabs } from '../GoalActivityWithTabs/GoalActivityWithTabs';
import { safeUserData } from '../../utils/getUserName';
import { useCriteriaValidityData } from '../CriteriaForm/CriteriaForm';

import { tr } from './GoalActivityFeed.i18n';
import s from './GoalActivityFeed.module.css';

const ModalOnEvent = dynamic(() => import('../ModalOnEvent'));
const GoalEditForm = dynamic(() => import('../GoalEditForm/GoalEditForm'));
const GoalCommentCreateForm = dynamic(() => import('../GoalCommentCreateForm'));

interface GoalActivityFeedProps {
    goal: NonNullable<GoalByIdReturnType>;
    shortId?: string;

    onGoalDeleteConfirm?: () => void;
    onInvalidate?: () => void;
}

type AddCriteriaMode = NonNullable<React.ComponentProps<typeof GoalCriteriaSuggest>['defaultMode']>;

export const GoalActivityFeed = forwardRef<HTMLDivElement, GoalActivityFeedProps>(
    ({ goal, shortId, onGoalDeleteConfirm, onInvalidate }, ref) => {
        const { user, allowedServices } = usePageContext();
        const {
            onGoalCommentUpdate,
            onGoalDelete,
            onGoalCriteriaAdd,
            onGoalCriteriaToggle,
            onGoalCriteriaUpdate,
            onGoalCriteriaRemove,
            onGoalCriteriaConvert,
            onCheckJiraTask,
            validateGoalCriteriaBindings,
            onGoalCommentCreate,
            onGoalCommentReactionToggle,
            onGoalCommentDelete,
            highlightCommentId,
        } = useGoalResource(
            {
                id: goal?.id,
                stateId: goal?.stateId,
            },
            {
                invalidate: {
                    getById: shortId,
                    getGoalCommentsFeed: {
                        goalId: goal.id,
                    },
                    getGoalActivityFeed: {
                        goalId: goal.id,
                    },
                    getGoalCriteriaList: {
                        id: goal.id,
                    },
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
            async (data: {
                title: string;
                weight: string;
                selected?: { id?: string; taskKey?: string };
                mode: AddCriteriaMode;
            }) => {
                await onGoalCriteriaAdd({
                    title: data.title,
                    weight: String(data.weight),
                    goalId: goal.id,
                    criteriaGoal:
                        data.mode === 'goal' && data.selected?.id
                            ? {
                                  id: data.selected.id,
                              }
                            : undefined,
                    externalTask:
                        data.mode === 'task' && data.selected?.taskKey
                            ? {
                                  taskKey: data.selected.taskKey,
                              }
                            : undefined,
                });
            },
            [goal.id, onGoalCriteriaAdd],
        );

        const handleUpdateCriteria = useCallback(
            async (data: {
                id?: string;
                title: string;
                weight?: number;
                selected?: { id?: string; taskKey?: string };
                mode: AddCriteriaMode;
            }) => {
                if (!data.id) return;

                await onGoalCriteriaUpdate({
                    id: data.id,
                    title: data.title,
                    weight: String(data.weight),
                    goalId: goal.id,
                    criteriaGoal:
                        data.mode === 'goal' && data.selected?.id
                            ? {
                                  id: data.selected.id,
                              }
                            : undefined,
                    externalTask:
                        data.mode === 'task' && data.selected?.taskKey
                            ? {
                                  taskKey: data.selected.taskKey,
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

        const handleCheckJiraTask = useCallback(
            ({ id }: { id: string }) => {
                onCheckJiraTask({ id });
            },
            [onCheckJiraTask],
        );

        const { data: parentGoalIds = [] } = trpc.v2.goal.getParentIds.useQuery([goal.id]);

        const criteriaValidityData = useCriteriaValidityData(goal._criteria);

        return (
            <>
                {nullable(goal._criteria?.length || goal._isEditable, () => (
                    <GoalCriteriaView
                        goalId={goal.id}
                        canEdit={goal._isEditable}
                        onUpdate={handleUpdateCriteria}
                        onCheck={handleUpdateCriteriaState}
                        onCheckJiraTask={handleCheckJiraTask}
                        onConvert={handleConvertCriteriaToGoal}
                        onRemove={handleRemoveCriteria}
                        list={goal._criteria?.map((criteria) =>
                            mapCriteria(criteria, criteria.criteriaGoal, criteria.externalTask),
                        )}
                    >
                        {nullable(goal._isEditable, () => (
                            <GoalFormPopupTrigger
                                offset={[-20, 0]}
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
                                    validityData={criteriaValidityData}
                                    filter={[goal.id, ...parentGoalIds.map((id) => id.id)]}
                                    externalAllowed={allowedServices?.jira}
                                />
                            </GoalFormPopupTrigger>
                        ))}
                    </GoalCriteriaView>
                ))}
                {nullable(goal._lastComment, (value) => (
                    <CommentView
                        pin
                        id={value.id}
                        author={safeUserData(value.activity)}
                        description={value.description}
                        state={value.state ?? undefined}
                        createdAt={value.createdAt}
                        reactions={value.reactions}
                        onSubmit={onGoalCommentSubmit(value)}
                        onReactionToggle={onGoalCommentReactionToggle(value.id)}
                        onDelete={onGoalCommentDelete(value.id)}
                        className={s.PinnedComment}
                    />
                ))}

                <GoalActivityWithTabs
                    ref={ref}
                    goalId={goal.id}
                    renderCommentItem={(value) => (
                        <CommentView
                            id={value.id}
                            author={value.author}
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
                >
                    <GoalCommentCreateForm
                        goalId={goal.id}
                        stateId={goal.stateId}
                        states={goal._isEditable || goal._isParticipant ? goal.project?.flow.states : undefined}
                        onSubmit={onGoalCommentCreate}
                    />
                </GoalActivityWithTabs>

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
