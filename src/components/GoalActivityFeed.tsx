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
import { GoalDependencyAddForm } from './GoalDependencyForm/GoalDependencyForm';
import { GoalDependencyListByKind } from './GoalDependencyList/GoalDependencyList';
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
    onGoalDependencyClick?: ComponentProps<typeof GoalDependencyListByKind>['onClick'];
    onGoalDeleteConfirm?: () => void;
}

export const GoalActivityFeed = forwardRef<HTMLDivElement, GoalActivityFeedProps>(
    ({ goal, shortId, onGoalCriteriaClick, onGoalDependencyClick, onGoalDeleteConfirm }, ref) => {
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
            onGoalDependencyAdd,
            onGoalDependencyRemove,
            lastStateComment,
            highlightCommentId,
        } = useGoalResource(
            {
                id: goal?.id,
                stateId: goal?.stateId,
                reactions: goal?.reactions,
                comments: goal?.comments,
            },
            {
                invalidate: {
                    getById: shortId,
                },
            },
        );

        const onConfirmDeletingGoal = useCallback(() => {
            onGoalDelete();
            onGoalDeleteConfirm?.();
        }, [onGoalDelete, onGoalDeleteConfirm]);

        const onGoalCommentSubmit = useCallback(
            (value: NonNullable<GoalByIdReturnType>['comments'][number]) => {
                return value.activity?.id === user?.activityId ? onGoalCommentUpdate(value.id) : undefined;
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

                            {goal._relations.map((deps) =>
                                nullable(deps.goals.length || goal._isEditable, () => (
                                    <GoalDependencyListByKind
                                        goalId={goal.id}
                                        key={deps.kind}
                                        kind={deps.kind}
                                        items={deps.goals}
                                        canEdit={goal._isEditable}
                                        onRemove={onGoalDependencyRemove}
                                        onClick={onGoalDependencyClick}
                                    >
                                        {nullable(goal._isEditable, () => (
                                            <GoalDependencyAddForm
                                                onSubmit={onGoalDependencyAdd}
                                                kind={deps.kind}
                                                goalId={goal.id}
                                                isEmpty={deps.goals.length === 0}
                                            />
                                        ))}
                                    </GoalDependencyListByKind>
                                )),
                            )}

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
                            onReactionToggle={onGoalCommentReactionToggle?.(value.id)}
                            onDelete={onGoalCommentDelete?.(value.id)}
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
