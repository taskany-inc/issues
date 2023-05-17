import { Comment } from '@prisma/client';

import { trpc } from '../utils/trpcClient';
import { CommentCreate, CommentUpdate } from '../schema/comment';
import { notifyPromise } from '../utils/notifyPromise';

export const useCommentResource = () => {
    const createMutation = trpc.comment.create.useMutation();
    const updateMutation = trpc.comment.update.useMutation();
    const deleteMutation = trpc.comment.delete.useMutation();

    const create =
        (cb: (params: Comment) => void) =>
        async ({ goalId, description }: CommentCreate) => {
            const promise = createMutation.mutateAsync({
                goalId,
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
