import * as Sentry from '@sentry/nextjs';
import { nonNull, stringArg, arg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Comment, CommentCreateInput, CommentDeleteInput, CommentUpdateInput } from '../types';
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
            data: nonNull(arg({ type: CommentCreateInput })),
        },
        resolve: async (_, { data: { goalId, description } }, { db, activity }) => {
            const [commentAuthor, goal] = await Promise.all([
                db.user.findUnique({
                    where: { id: activity?.id },
                    include: { activity: { include: { user: true, ghost: true } } },
                }),
                db.goal.findUnique({
                    where: { id: goalId },
                    include: {
                        participants: { include: { user: true, ghost: true } },
                        activity: { include: { user: true, ghost: true } },
                    },
                }),
            ]);

            if (!commentAuthor || !commentAuthor.activity) return null;
            if (!goal) return null;

            if (!goal.participants.length) {
                Sentry.captureException(new Error('Goal without participants'), {
                    tags: {
                        scope: 'graphql',
                        resolvers: 'Comment',
                    },
                    extra: {
                        goalId: goal.id,
                        activityId: commentAuthor.id,
                    },
                });
            }

            try {
                const newComment = await db.comment.create({
                    data: {
                        description,
                        activityId: commentAuthor.activity.id,
                        goalId,
                    },
                });

                let toEmails = goal.participants;

                if (commentAuthor.activity.user?.email === goal.activity?.user?.email) {
                    toEmails = toEmails.filter((p) => p.user?.email !== commentAuthor.activity?.user?.email);
                }

                if (toEmails.length) {
                    await mailServer.sendMail({
                        from: `"Taskany Issues" <${process.env.MAIL_USER}>`,
                        to: toEmails.map((p) => p.user?.email).join(' ,'),
                        subject: 'Hello ✔',
                        text: `new comment for ${process.env.NEXTAUTH_URL}/goals/${goalId}#comment-${newComment.id}`,
                        html: `<a href="${process.env.NEXTAUTH_URL}/goals/${goalId}#comment-${newComment.id}">new comment</a> for <a href="${process.env.NEXTAUTH_URL}/goals/${goalId}">${goalId}</a>`,
                    });
                }

                return newComment;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });

    t.field('updateComment', {
        type: Comment,
        args: {
            data: nonNull(arg({ type: CommentUpdateInput })),
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

    t.field('deleteComment', {
        type: Comment,
        args: {
            data: nonNull(arg({ type: CommentDeleteInput })),
        },
        resolve: async (_, { data: { id } }, { db }) => {
            try {
                return db.comment.delete({
                    where: {
                        id,
                    },
                });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
