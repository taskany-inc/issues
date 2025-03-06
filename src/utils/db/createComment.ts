import { Role, StateType } from '@prisma/client';

import { prisma } from '../prisma';
import { goalIncludeCriteriaParams, recalculateCriteriaScore } from '../recalculateCriteriaScore';
import { prepareRecipients } from '../prepareRecipients';
import { createEmail } from '../createEmail';
import { parseCrewLoginFromText } from '../crew';

import { updateProjectUpdatedAt } from './updateProjectUpdatedAt';
import { addCalculatedGoalsFields } from './calculatedGoalsFields';
import { getLocalUsersByCrewLogin } from './crewIntegration';
import { getProjectsEditableStatus } from './getProjectEditable';

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

    const projectIds = [actualGoal.projectId ?? ''];
    const editableMap = await getProjectsEditableStatus(projectIds, activityId, role);
    const { _isEditable, _shortId, _isParticipant } = addCalculatedGoalsFields(
        actualGoal,
        { _isEditable: Boolean(actualGoal.projectId && editableMap.get(actualGoal.projectId)) },
        activityId,
        role,
    );

    const canEdit = _isEditable || _isParticipant;

    const commentCreateOperation = prisma.comment.create({
        data: {
            description,
            activityId: commentAuthor.id,
            goalId,
            stateId: canEdit ? stateId : undefined,
        },
        include: {
            activity: {
                include: {
                    user: true,
                },
            },
            state: true,
        },
    });

    const [updatedGoal, newComment] =
        stateId || shouldUpdateGoal
            ? await prisma.$transaction([
                  prisma.goal.update({
                      where: { id: goalId },
                      data: {
                          id: goalId,
                          stateId: canEdit ? pushState?.id : actualGoal.stateId,
                          goalInCriteria: {
                              updateMany: {
                                  where: {
                                      id: { in: actualGoal.goalInCriteria.map(({ id }) => id) },
                                  },
                                  data: {
                                      isDone: canEdit && pushState?.type && pushState?.type === StateType.Completed,
                                  },
                              },
                          },
                          history:
                              canEdit && stateId && stateId !== actualGoal.stateId
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

    if (canEdit && stateId && stateId !== updatedGoal.stateId) {
        await recalculateCriteriaScore(updatedGoal.id).recalcLinkedGoalsScores().recalcAverageProjectScore().run();
    }

    if (newComment.activity.user) {
        const recipients = await prepareRecipients([
            ...actualGoal.participants,
            ...actualGoal.watchers,
            actualGoal.activity,
            actualGoal.owner,
        ]);

        if (stateId) {
            await createEmail('goalStateUpdatedWithComment', {
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
            await createEmail('goalCommented', {
                to: recipients,
                shortId: _shortId,
                title: actualGoal.title,
                commentId: newComment.id,
                author: newComment.activity.user.name || newComment.activity.user.email,
                authorEmail: newComment.activity.user.email,
                body: newComment.description,
            });
        }

        const { items: localUsers } = await getLocalUsersByCrewLogin(parseCrewLoginFromText(description));

        await createEmail('mentionedInComment', {
            to: await prepareRecipients(localUsers),
            shortId: _shortId,
            title: actualGoal.title,
            commentId: newComment.id,
            author: newComment.activity.user?.name || newComment.activity.user?.email,
            authorEmail: newComment.activity.user?.email,
            body: newComment.description,
        });
    }

    return newComment;
};
