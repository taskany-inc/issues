import { useCallback, useMemo } from 'react';
import type { Activity } from '@prisma/client';

import { trpc } from '../utils/trpcClient';
import { notifyPromise } from '../utils/notifyPromise';
import { GoalCommon, GoalStateChangeSchema, GoalUpdate, ToggleGoalDependency } from '../schema/goal';
import {
    AddCriteriaSchema,
    RemoveCriteriaSchema,
    UpdateCriteriaSchema,
    UpdateCriteriaStateSchema,
} from '../schema/criteria';
import { ModalEvent, dispatchModalEvent } from '../utils/dispatchModal';
import { GoalComment } from '../types/comment';
import { TagObject } from '../types/tag';

import { useHighlightedComment } from './useHighlightedComment';
import { useReactionsResource } from './useReactionsResource';

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type TRPCContextGoal = ReturnType<typeof trpc.useContext>['goal'];
type RefetchKeys = Exclude<keyof TRPCContextGoal, 'invalidate'>;
type ArgsByRefetchKey = Exclude<Functions[RefetchKeys], undefined>;
type Functions = {
    [K in RefetchKeys]?: Parameters<TRPCContextGoal[K]['invalidate']>[0];
};

type Configuration = { invalidate: Functions; afterInvalidate?: () => void };
type GoalFields = {
    id?: string;
    stateId?: string | null;
    comments?: GoalComment[];
};

export const useGoalResource = (fields: GoalFields, config?: Configuration) => {
    const utils = trpc.useContext();
    const id = useMemo(() => fields.id, [fields.id]);

    const invalidate = useCallback(
        async (invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            if (!config?.invalidate) return;

            const { invalidate: invalidates, afterInvalidate } = config;

            let keys = null;
            if (invalidateKey) {
                keys = typeof invalidateKey === 'string' ? [invalidateKey] : invalidateKey;
            } else {
                keys = Object.keys(invalidates) as RefetchKeys[];
            }

            await Promise.all(
                keys.map((key) => {
                    const { invalidate: invalidateFn } = utils.goal[key];
                    const args = invalidates[key] as UnionToIntersection<ArgsByRefetchKey>;

                    if (args) {
                        return invalidateFn(args);
                    }

                    return true;
                }),
            );

            afterInvalidate?.();
        },
        [config, utils.goal],
    );

    const toggleGoalWatcher = trpc.goal.toggleWatcher.useMutation();
    const onGoalStarTogglegizer = trpc.goal.toggleStargizer.useMutation();
    const updateGoalMutation = trpc.goal.update.useMutation();
    const addGoalDependency = trpc.goal.addDependency.useMutation();
    const removeGoalDependency = trpc.goal.removeDependency.useMutation();
    const createGoalComment = trpc.goal.createComment.useMutation();
    const updateGoalComment = trpc.goal.updateComment.useMutation();
    const deleteGoalComment = trpc.goal.deleteComment.useMutation();
    const addGoalCriteria = trpc.goal.addCriteria.useMutation();
    const toggleGoalCriteria = trpc.goal.updateCriteriaState.useMutation();
    const updateGoalCriteria = trpc.goal.updateCriteria.useMutation();
    const removeGoalCriteria = trpc.goal.removeCriteria.useMutation();
    const convertGoalCriteria = trpc.goal.convertCriteriaToGoal.useMutation();
    const stateChangeMutations = trpc.goal.switchState.useMutation();
    const archiveMutation = trpc.goal.toggleArchive.useMutation();
    const addParticipantMutation = trpc.goal.addParticipant.useMutation();
    const removeParticipantMutation = trpc.goal.removeParticipant.useMutation();
    const changeProjectMutation = trpc.goal.changeProject.useMutation();
    const updateGoalTagMutation = trpc.goal.updateTag.useMutation();
    const updateGoalOwnerMutation = trpc.goal.updateOwner.useMutation();
    const createGoalMutation = trpc.goal.create.useMutation();
    const addPartnerProjectMutation = trpc.goal.addPartnerProject.useMutation();
    const removePartnerProjectMutation = trpc.goal.removePartnerProject.useMutation();
    const validateGoalCriteriaBindings = utils.goal.checkGoalInExistingCriteria.fetch;

    const { highlightCommentId, setHighlightCommentId } = useHighlightedComment();
    const { commentReaction } = useReactionsResource();

    const onGoalWatchingToggle = useCallback(
        async (watcher?: boolean, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            const [data] = await notifyPromise(
                toggleGoalWatcher.mutateAsync({
                    id,
                    direction: !watcher,
                }),
                !watcher ? 'goalsWatch' : 'goalsUnwatch',
            );

            if (data) {
                invalidate(invalidateKey);
            }
        },
        [id, toggleGoalWatcher, invalidate],
    );

    const onGoalStarToggle = useCallback(
        async (stargizer?: boolean, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            const [data] = await notifyPromise(
                onGoalStarTogglegizer.mutateAsync({
                    id,
                    direction: !stargizer,
                }),
                !stargizer ? 'goalsStar' : 'goalsUnstar',
            );

            if (data) {
                invalidate(invalidateKey);
            }
        },
        [id, onGoalStarTogglegizer, invalidate],
    );

    const goalUpdate = useCallback(
        async (data: Omit<GoalUpdate, 'id'>) => {
            if (!id) return;

            const promise = updateGoalMutation.mutateAsync({
                ...data,
                id,
            });

            notifyPromise(promise, 'goalsUpdate');

            return promise;
        },
        [id, updateGoalMutation],
    );

    const goalCreate = useCallback(
        async (form: GoalCommon) => {
            const promise = createGoalMutation.mutateAsync(form);

            notifyPromise(promise, 'goalsCreate');

            return promise;
        },
        [createGoalMutation],
    );

    const onGoalDependencyAdd = useCallback(
        async (val: ToggleGoalDependency, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            const [data] = await notifyPromise(addGoalDependency.mutateAsync(val), 'goalsUpdate');

            if (data) {
                invalidate(invalidateKey);
            }
        },
        [addGoalDependency, invalidate],
    );

    const onGoalDependencyRemove = useCallback(
        async (val: ToggleGoalDependency, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            const [data] = await notifyPromise(removeGoalDependency.mutateAsync(val), 'goalsUpdate');

            if (data) {
                invalidate(invalidateKey);
            }
        },
        [removeGoalDependency, invalidate],
    );

    const onGoalCommentCreate = useCallback(
        async (comment?: { description: string; stateId?: string }, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            if (!comment || !id) return;

            const promise = createGoalComment.mutateAsync({
                goalId: id,
                ...comment,
            });

            const [data] = await notifyPromise(promise, 'commentCreate');

            if (data) {
                setHighlightCommentId(data.id);

                invalidate(invalidateKey);
            }

            return data;
        },
        [createGoalComment, id, invalidate, setHighlightCommentId],
    );

    const onGoalCommentUpdate = useCallback(
        (commentId: string, invalidateKey?: RefetchKeys | RefetchKeys[]) =>
            async (comment?: { description: string }) => {
                if (!comment || !commentId) return;

                const promise = updateGoalComment.mutateAsync({
                    ...comment,
                    id: commentId,
                });

                const [data] = await notifyPromise(promise, 'commentUpdate');

                if (data) {
                    invalidate(invalidateKey);
                }
            },
        [invalidate, updateGoalComment],
    );

    const onGoalCommentReactionToggle = useCallback(
        (id: string, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            return commentReaction(id, () => invalidate(invalidateKey));
        },
        [commentReaction, invalidate],
    );

    const onGoalCommentDelete = useCallback(
        (id: string, invalidateKey?: RefetchKeys | RefetchKeys[]) => async () => {
            const [data] = await notifyPromise(deleteGoalComment.mutateAsync({ id }), 'commentDelete');

            if (data) {
                invalidate(invalidateKey);
            }
        },
        [deleteGoalComment, invalidate],
    );

    const lastStateComment = useMemo(() => {
        if ((fields.comments?.length ?? 0) <= 1) {
            return null;
        }

        const foundResult = fields.comments?.findLast((comment) => comment.stateId);
        return foundResult?.stateId === fields.stateId ? foundResult : null;
    }, [fields.comments, fields.stateId]);

    const onGoalCriteriaAdd = useCallback(
        async (val: AddCriteriaSchema, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            await notifyPromise(addGoalCriteria.mutateAsync(val), 'criteriaCreate');

            invalidate(invalidateKey);
        },
        [addGoalCriteria, invalidate],
    );

    const onGoalCriteriaToggle = useCallback(
        async (val: UpdateCriteriaStateSchema, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            await notifyPromise(toggleGoalCriteria.mutateAsync(val), 'criteriaUpdate');

            invalidate(invalidateKey);
        },
        [invalidate, toggleGoalCriteria],
    );

    const onGoalCriteriaUpdate = useCallback(
        async (val: UpdateCriteriaSchema, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            await notifyPromise(updateGoalCriteria.mutateAsync(val), 'criteriaUpdate');

            invalidate(invalidateKey);
        },
        [invalidate, updateGoalCriteria],
    );

    const onGoalCriteriaRemove = useCallback(
        async (val: RemoveCriteriaSchema, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            await notifyPromise(removeGoalCriteria.mutateAsync(val), 'criteriaDelete');

            invalidate(invalidateKey);
        },
        [invalidate, removeGoalCriteria],
    );

    const onGoalCriteriaConvert = useCallback(
        (val: { title: string; id: string }, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            dispatchModalEvent(ModalEvent.GoalCreateModal, {
                title: val.title,
                onGoalCreate: async (createdGoal) => {
                    if (!createdGoal) return;

                    await notifyPromise(
                        convertGoalCriteria.mutateAsync({
                            title: createdGoal?.title,
                            id: val.id,
                            criteriaGoal: {
                                id: createdGoal.id,
                            },
                        }),
                        'criteriaUpdate',
                    );

                    invalidate(invalidateKey);
                },
            })();
        },
        [convertGoalCriteria, invalidate],
    );

    const onGoalStateChange = useCallback(
        async (nextState: GoalStateChangeSchema['state'], invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            if (!id) return;

            await stateChangeMutations.mutateAsync({
                id,
                state: nextState,
            });

            invalidate(invalidateKey);
        },
        [id, invalidate, stateChangeMutations],
    );

    const onGoalDelete = useCallback(
        async (invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            if (!id) return;

            const [data] = await notifyPromise(
                archiveMutation.mutateAsync({
                    id,
                    archived: true,
                }),
                'goalsDelete',
            );

            if (data) {
                invalidate(invalidateKey);
            }
        },
        [id, archiveMutation, invalidate],
    );

    const onGoalParticipantAdd = useCallback(
        async (activity?: NonNullable<Activity>, invalidateKey?: RefetchKeys | RefetchKeys[]) => {
            if (!id || !activity) return;

            await notifyPromise(addParticipantMutation.mutateAsync({ id, activityId: activity.id }), 'goalsUpdate');

            await invalidate(invalidateKey);
        },
        [addParticipantMutation, id, invalidate],
    );

    const onGoalParticipantRemove = useCallback(
        (activityId?: string | null, invalidateKey?: RefetchKeys | RefetchKeys[]) => async () => {
            if (!id || !activityId) return;

            await notifyPromise(removeParticipantMutation.mutateAsync({ id, activityId }), 'goalsUpdate');

            await invalidate(invalidateKey);
        },
        [id, invalidate, removeParticipantMutation],
    );

    const goalProjectChange = useCallback(
        async (projectId: string) => {
            if (!projectId || !id) return;

            const promise = changeProjectMutation.mutateAsync({
                id,
                projectId,
            });

            await notifyPromise(promise, 'goalsUpdate');

            return promise;
        },
        [changeProjectMutation, id],
    );

    const goalTagsUpdate = useCallback(
        async (tags: TagObject[]) => {
            if (!id) return;

            const promise = updateGoalTagMutation.mutateAsync({
                id,
                tags,
            });

            await notifyPromise(promise, 'goalsUpdate');

            return promise;
        },
        [id, updateGoalTagMutation],
    );

    const goalOwnerUpdate = useCallback(
        async (activity?: NonNullable<Activity>) => {
            if (!id || !activity?.id) return;

            const promise = updateGoalOwnerMutation.mutateAsync({
                id,
                ownerId: activity?.id,
            });

            await notifyPromise(promise, 'goalsUpdate');

            await invalidate();

            return promise;
        },
        [id, updateGoalOwnerMutation, invalidate],
    );

    const addPartnerProject = useCallback(
        async (projectId: string) => {
            if (!id) return;

            const promise = addPartnerProjectMutation.mutateAsync({
                id,
                projectId,
            });

            await notifyPromise(promise, 'goalsUpdate');

            await invalidate();

            return promise;
        },
        [id, addPartnerProjectMutation, invalidate],
    );

    const removePartnerProject = useCallback(
        async (projectId: string) => {
            if (!id) return;

            const promise = removePartnerProjectMutation.mutateAsync({
                id,
                projectId,
            });

            await notifyPromise(promise, 'goalsUpdate');

            await invalidate();

            return promise;
        },
        [id, removePartnerProjectMutation, invalidate],
    );

    const onGoalTagAdd = useCallback(
        async (tags: TagObject[]) => {
            await goalTagsUpdate(tags);

            invalidate();
        },
        [invalidate, goalTagsUpdate],
    );

    const onGoalTagRemove = useCallback(
        (tags: TagObject[], removedTag: TagObject) => async () => {
            const actualTags = tags.filter((tag) => tag.id !== removedTag.id);
            await goalTagsUpdate(actualTags);

            invalidate();
        },
        [invalidate, goalTagsUpdate],
    );

    const onGoalTransfer = useCallback(
        (callback: (transferredGoal: NonNullable<Awaited<ReturnType<typeof goalProjectChange>>>) => void) =>
            async (project: { id: string }) => {
                const transferredGoal = await goalProjectChange(project.id);

                if (transferredGoal) {
                    callback(transferredGoal);
                }
            },
        [goalProjectChange],
    );

    return {
        highlightCommentId,
        lastStateComment,

        invalidate,

        goalCreate,
        goalUpdate,
        goalProjectChange,
        goalTagsUpdate,
        goalOwnerUpdate,

        onGoalStateChange,
        onGoalDelete,
        onGoalTransfer,

        onGoalWatchingToggle,
        onGoalStarToggle,

        onGoalParticipantAdd,
        onGoalParticipantRemove,

        onGoalDependencyAdd,
        onGoalDependencyRemove,

        onGoalCriteriaAdd,
        onGoalCriteriaToggle,
        onGoalCriteriaUpdate,
        onGoalCriteriaRemove,
        onGoalCriteriaConvert,
        validateGoalCriteriaBindings,

        onGoalTagAdd,
        onGoalTagRemove,

        onGoalCommentCreate,
        onGoalCommentUpdate,
        onGoalCommentReactionToggle,
        onGoalCommentDelete,

        addPartnerProject,
        removePartnerProject,
    };
};
