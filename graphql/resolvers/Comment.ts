import { nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Comment, computeUserFields, withComputedField } from '../types';

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
                    author: {
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
                db.goal.findUnique({ where: { id: goalId } }),
            ]);

            if (!commentAuthor || !commentAuthor.activity) return null;
            if (!goal) return null;

            try {
                const newComment = db.comment.create({
                    data: {
                        description,
                        authorId: commentAuthor.activity.id,
                        goalId,
                    },
                });

                return newComment;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
