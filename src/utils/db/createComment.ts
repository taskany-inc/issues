import { Role, StateType } from '@prisma/client';

import { prisma } from '../prisma';
import { goalIncludeCriteriaParams, recalculateCriteriaScore } from '../recalculateCriteriaScore';
import { prepareRecipients } from '../prepareRecipients';
import { createEmailJob } from '../worker/create';

import { updateProjectUpdatedAt } from './updateProjectUpdatedAt';
import { addCalculatedGoalsFields } from './calculatedGoalsFields';

export const createComment = async ({
    description,
    stateId,
    activityId,
    goalId,
    role,
    shouldUpdateGoal = true,
}: {
    description: string;
    stateId?: string;
    activityId: string;
    role: Role;
    goalId: string;
    shouldUpdateGoal?: boolean;
}) => {
    const [commentAuthor, actualGoal, pushState] = await Promise.all([
        prisma.activity.findUnique({
            where: { id: activityId },
            include: { user: true, ghost: true },
        }),
        prisma.goal.findUnique({
            where: { id: goalId },
            include: {
                participants: { include: { user: true, ghost: true } },
                watchers: { include: { user: true, ghost: true } },
                activity: { include: { user: true, ghost: true } },
                owner: { include: { user: true, ghost: true } },
                state: true,
                project: true,
                goalInCriteria: goalIncludeCriteriaParams,
            },
        }),
        stateId ? prisma.state.findUnique({ where: { id: stateId } }) : Promise.resolve(undefined),
    ]);

    if (!commentAuthor) return null;
    if (!actualGoal) return null;

    const { _isEditable, _shortId } = addCalculatedGoalsFields(actualGoal, activityId, role);

    const commentCreateOperation = prisma.comment.create({
        data: {
            description,
            activityId: commentAuthor.id,
            goalId,
            stateId: _isEditable ? stateId : undefined,
        },
        include: {
            activity: {
                include: {
                    user: true,
                },
            },
        },
    });

    const [updatedGoal, newComment] =
        stateId || shouldUpdateGoal
            ? await prisma.$transaction([
                  prisma.goal.update({
                      where: { id: goalId },
                      data: {
                          id: goalId,
                          stateId: _isEditable ? pushState?.id : actualGoal.stateId,
                          goalInCriteria: {
                              updateMany: {
                                  where: {
                                      id: { in: actualGoal.goalInCriteria.map(({ id }) => id) },
                                  },
                                  data: {
                                      isDone: _isEditable && pushState?.type && pushState?.type === StateType.Completed,
                                  },
                              },
                          },
                          history:
                              _isEditable && stateId && stateId !== actualGoal.stateId
                                  ? {
                                        create: {
                                            subject: 'state',
                                            action: 'change',
                                            previousValue: actualGoal.stateId,
                                            nextValue: stateId,
                                            activityId,
                                        },
                                    }
                                  : undefined,
                          // subscribe comment author
                          watchers: {
                              connect: [{ id: commentAuthor.id }],
                          },
                      },
                      include: {
                          goalInCriteria: goalIncludeCriteriaParams,
                          state: true,
                      },
                  }),
                  commentCreateOperation,
              ])
            : await Promise.all([Promise.resolve(actualGoal), commentCreateOperation]);

    await updateProjectUpdatedAt(updatedGoal.projectId);

    if (_isEditable && stateId && stateId !== updatedGoal.stateId) {
        await recalculateCriteriaScore(updatedGoal.id).recalcLinkedGoalsScores().recalcAverageProjectScore().run();
    }

    if (newComment.activity.user) {
        const recipients = prepareRecipients(
            [...actualGoal.participants, ...actualGoal.watchers, actualGoal.activity, actualGoal.owner],
            newComment.activity.user.email,
        );

        if (stateId) {
            await createEmailJob('goalStateUpdatedWithComment', {
                to: recipients,
                shortId: _shortId,
                stateTitleBefore: actualGoal.state?.title,
                stateTitleAfter: updatedGoal.state?.title,
                title: actualGoal.title,
                commentId: newComment.id,
                author: newComment.activity.user.name || newComment.activity.user.email,
                authorEmail: newComment.activity.user.email,
                body: newComment.description,
            });
        } else {
            await createEmailJob('goalCommented', {
                to: recipients,
                shortId: _shortId,
                title: actualGoal.title,
                commentId: newComment.id,
                author: newComment.activity.user.name || newComment.activity.user.email,
                authorEmail: newComment.activity.user.email,
                body: newComment.description,
            });
        }
    }

    return newComment;
};
