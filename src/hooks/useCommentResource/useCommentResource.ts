import toast from 'react-hot-toast';
import { Comment } from '@prisma/client';

import { trpc } from '../../utils/trpcClient';
import { CommentCreate, CommentUpdate } from '../../schema/comment';

import { tr } from './useCommentResource.i18n';

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

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are publishing your comment'),
                success: tr('Voila! Comment is here 🎉'),
            });

            const data = await promise;

            data && cb(data);
        };

    const update =
        (cb: (params: Comment) => void) =>
        async ({ id, description }: CommentUpdate) => {
            const promise = updateMutation.mutateAsync({
                id,
                description,
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are updating your comment'),
                success: tr('Comment updated'),
            });

            const data = await promise;

            data && cb(data);
        };

    const remove =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ id }: { id: string }) => {
            const promise = deleteMutation.mutateAsync(id);

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are deleting your comment'),
                success: tr('Comment removed'),
            });

            const data = await promise;

            data && cb(data);
        };

    return { create, update, remove };
};
