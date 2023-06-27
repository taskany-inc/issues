import { Comment } from '@prisma/client';

import { trpc } from '../utils/trpcClient';
import { GoalCommentSchema } from '../schema/goal';
import { notifyPromise } from '../utils/notifyPromise';

export const useCommentResource = () => {
    const createMutation = trpc.goal.createComment.useMutation();
    const updateMutation = trpc.goal.updateComment.useMutation();
    const deleteMutation = trpc.goal.deleteComment.useMutation();

    const create =
        (cb: (params: Comment) => void) =>
        async ({ goalId, stateId, description }: GoalCommentSchema) => {
            const promise = createMutation.mutateAsync({
                goalId,
                stateId,
                description,
            });

            const [data] = await notifyPromise(promise, 'commentCreate');

            data && cb(data);
        };

    const update =
        (cb: (params: Comment) => void) =>
        async ({ id, description }: GoalCommentSchema) => {
            const promise = updateMutation.mutateAsync({
                id,
                description,
            });

            const [data] = await notifyPromise(promise, 'commentUpdate');

            data && cb(data);
        };

    const remove =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ id }: { id: string }) => {
            const promise = deleteMutation.mutateAsync(id);

            notifyPromise(promise, 'commentDelete');

            const data = await promise;

            data && cb(data);
        };

    return { create, update, remove };
};
