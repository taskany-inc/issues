import { z } from 'zod';
import toast from 'react-hot-toast';

import { gql } from '../../utils/gql';
import { Comment, CommentDeleteInput } from '../../../graphql/@generated/genql';
import { usePageContext } from '../usePageContext';

import { tr } from './useCommentResource.i18n';

// FIXME: problem with passing this errors
const createSchemaProvider = () =>
    z.object({
        description: z
            .string({
                required_error: tr("Comments's description is required"),
                invalid_type_error: tr("Comments's description must be a string"),
            })
            .min(1, {
                message: tr("Comments's description must be longer than 1 symbol"),
            }),
        goalId: z.string().min(1),
    });

const updateSchemaProvider = () =>
    z.object({
        id: z.string().min(1),
        description: z
            .string({
                required_error: tr("Comments's description is required"),
                invalid_type_error: tr("Comments's description must be a string"),
            })
            .min(1, {
                message: tr("Comments's description must be longer than 1 symbol"),
            }),
    });

export type CreateFormType = z.infer<ReturnType<typeof createSchemaProvider>>;
export type UpdateFormType = z.infer<ReturnType<typeof updateSchemaProvider>>;

export const useCommentResource = () => {
    const { user } = usePageContext();

    const create =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ goalId, description }: CreateFormType) => {
            const promise = gql.mutation({
                createComment: [
                    {
                        data: {
                            goalId,
                            description,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are publishing your comment'),
                success: tr('Voila! Comment is here 🎉'),
            });

            const data = await promise;

            data?.createComment && cb(data.createComment);
        };

    const update =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ id, description }: UpdateFormType) => {
            const promise = gql.mutation({
                updateComment: [
                    {
                        data: {
                            id,
                            description,
                        },
                    },
                    {
                        id: true,
                        description: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are updating your comment'),
                success: tr('Comment updated'),
            });

            const data = await promise;

            data.updateComment && cb(data.updateComment);
        };

    const remove =
        (cb: (params: Partial<Comment>) => void) =>
        async ({ id }: CommentDeleteInput) => {
            const promise = gql.mutation({
                deleteComment: [
                    {
                        data: {
                            id,
                        },
                    },
                    {
                        id: true,
                    },
                ],
            });

            toast.promise(promise, {
                error: tr('Something went wrong 😿'),
                loading: tr('We are deleting your comment'),
                success: tr('Comment removed'),
            });

            const data = await promise;

            data.deleteComment && cb(data.deleteComment);
        };

    return { createSchema: createSchemaProvider(), updateSchema: updateSchemaProvider(), create, update, remove };
};
