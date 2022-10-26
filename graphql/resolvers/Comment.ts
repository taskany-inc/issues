import { nonNull, stringArg, arg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Comment, CommentCreateInputType, CommentUpdateInputType } from '../types';
import { mailServer } from '../../src/utils/mailServer';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('goalComment', {
        type: Comment,
        args: {
            goalId: nonNull(stringArg()),
        },
        resolve: async (_, { goalId }, { db }) => {
            return db.comment.findMany({
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
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createComment', {
        type: Comment,
        args: {
            data: nonNull(arg({ type: CommentCreateInputType })),
        },
        resolve: async (_, { data: { goalId, description, activityId } }, { db }) => {
            const [commentAuthor, goal] = await Promise.all([
                db.user.findUnique({ where: { id: activityId }, include: { activity: true } }),
                db.goal.findUnique({
                    where: { id: goalId },
                    include: { participants: { include: { user: true, ghost: true } } },
                }),
            ]);

            if (!commentAuthor || !commentAuthor.activity) return null;
            if (!goal) return null;

            try {
                const newComment = await db.comment.create({
                    data: {
                        description,
                        activityId: commentAuthor.activity.id,
                        goalId,
                    },
                });

                await mailServer.sendMail({
                    from: `"Taskany Issues" <${process.env.MAIL_USER}>`,
                    to: goal.participants.map((p) => p.user?.email).join(' ,'),
                    subject: 'Hello ✔',
                    text: `new comment for ${process.env.NEXTAUTH_URL}/goals/${goalId}#comment-${newComment.id}`,
                    html: `<a href="${process.env.NEXTAUTH_URL}/goals/${goalId}#comment-${newComment.id}">new comment</a> for <a href="${process.env.NEXTAUTH_URL}/goals/${goalId}">${goalId}</a>`,
                });

                return newComment;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });

    t.field('updateComment', {
        type: Comment,
        args: {
            data: nonNull(arg({ type: CommentUpdateInputType })),
        },
        resolve: async (_, { data: { id, description } }, { db }) => {
            try {
                const newComment = await db.comment.update({
                    where: {
                        id,
                    },
                    data: {
                        description,
                    },
                });

                return newComment;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
