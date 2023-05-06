import z from 'zod';
import { TRPCError } from '@trpc/server';

import { prisma } from '../../src/utils/prisma';
import { mailServer } from '../../src/utils/mailServer';
import { protectedProcedure, router } from '../trpcBackend';
import { commentCreateSchema, commentUpdateSchema } from '../../src/schema/comment';

export const commentRouter = router({
    getGoalComments: protectedProcedure.input(z.string()).query(async ({ input: goalId }) => {
        return prisma.comment.findMany({
            where: {
                goalId,
            },
            include: {
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                reactions: true,
            },
        });
    }),
    create: protectedProcedure.input(commentCreateSchema).mutation(async ({ ctx, input }) => {
        const [commentAuthor, goal] = await Promise.all([
            prisma.activity.findUnique({
                where: { id: ctx.session.user.activityId },
                include: { user: true, ghost: true },
            }),
            prisma.goal.findUnique({
                where: { id: input.goalId },
                include: {
                    participants: { include: { user: true, ghost: true } },
                    activity: { include: { user: true, ghost: true } },
                },
            }),
        ]);

        if (!commentAuthor) return null;
        if (!goal) return null;

        try {
            const newComment = await prisma.comment.create({
                data: {
                    description: input.description,
                    activityId: commentAuthor.id,
                    goalId: input.goalId,
                },
            });

            let toEmails = goal.participants;

            if (commentAuthor.user?.email === goal.activity?.user?.email) {
                toEmails = toEmails.filter((p) => p.user?.email !== commentAuthor?.user?.email);
            }

            if (toEmails.length) {
                await mailServer.sendMail({
                    from: `"Taskany Issues" <${process.env.MAIL_USER}>`,
                    to: toEmails.map((p) => p.user?.email).join(' ,'),
                    subject: 'Hello ✔',
                    text: `new comment for ${process.env.NEXTAUTH_URL}/goals/${input.goalId}#comment-${newComment.id}`,
                    html: `<a href="${process.env.NEXTAUTH_URL}/goals/${input.goalId}#comment-${newComment.id}">new comment</a> for <a href="${process.env.NEXTAUTH_URL}/goals/${input.goalId}">${input.goalId}</a>`,
                });
            }

            return newComment;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    update: protectedProcedure.input(commentUpdateSchema).mutation(async ({ input: { id, description } }) => {
        try {
            const newComment = await prisma.comment.update({
                where: {
                    id,
                },
                data: {
                    description,
                },
            });

            return newComment;
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
    delete: protectedProcedure.input(z.string()).mutation(async ({ input: id }) => {
        try {
            return prisma.comment.delete({
                where: {
                    id,
                },
            });
        } catch (error: any) {
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(error.message), cause: error });
        }
    }),
});
