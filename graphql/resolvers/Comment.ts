import { nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Comment, computeUserFields, withComputedField } from '../types';
import { mailServer } from '../../src/utils/mailServer';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('goalComment', {
        type: Comment,
        args: {
            goalId: nonNull(stringArg()),
        },
        resolve: async (_, { goalId }, { db }) => {
            const comments = await db.comment.findMany({
                where: {
                    goalId,
                },
                include: {
                    activity: {
                        ...computeUserFields,
                    },
                    reactions: true,
                },
            });

            return comments.map(withComputedField('author'));
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createComment', {
        type: Comment,
        args: {
            goalId: nonNull(stringArg()),
            description: nonNull(stringArg()),
            authorId: nonNull(stringArg()),
        },
        resolve: async (_, { goalId, description, authorId }, { db }) => {
            const [commentAuthor, goal] = await Promise.all([
                db.user.findUnique({ where: { id: authorId }, include: { activity: true } }),
                db.goal.findUnique({ where: { id: goalId }, include: { participants: { ...computeUserFields } } }),
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
                    from: '"Taskany Issues" <notify@taskany.org>',
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
};
