import { Comment } from '@prisma/client';

import { trpc } from '../utils/trpcClient';
import { GoalCommentCreate } from '../schema/goal';
import { CommentUpdate } from '../schema/comment';
import { notifyPromise } from '../utils/notifyPromise';

export const useCommentResource = () => {
    const createMutation = trpc.goal.createComment.useMutation();
    const updateMutation = trpc.comment.update.useMutation();
    const deleteMutation = trpc.comment.delete.useMutation();

    const create =
        (cb: (params: Comment) => void) =>
        async ({ id, stateId, description }: GoalCommentCreate) => {
            const promise = createMutation.mutateAsync({
                id,
                stateId,
                description,
            });

            const [data] = await notifyPromise(promise, 'commentCreate');

            data && cb(data);
        };

    const update =
        (cb: (params: Comment) => void) =>
        async ({ id, description }: CommentUpdate) => {
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
