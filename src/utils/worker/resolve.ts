import { Role, StateType } from '@prisma/client';

import { prisma } from '../prisma';
import { goalIncludeCriteriaParams, recalculateCriteriaScore } from '../recalculateCriteriaScore';
import { prepareRecipients } from '../prepareRecipients';

import { createEmailJob, JobDataMap } from './create';
import { goalPingJob } from './goalPingJob';
import { sendMail } from './mail';
import * as emailTemplates from './mail/templates';

export const addCommonCalculatedGoalFields = (goal: any) => {
    const _shortId = `${goal.projectId}-${goal.scopeId}`;
    const _hasAchievementCriteria = !!goal.goalAchiveCriteria?.length;

    return {
        _shortId,
        _hasAchievementCriteria,
    };
};

export const addCalculatedGoalsFields = (goal: any, activityId: string, role: Role) => {
    const _isOwner = goal.ownerId === activityId;
    const _isParticipant = goal.participants?.some((participant: any) => participant?.id === activityId);
    const _isWatching = goal.watchers?.some((watcher: any) => watcher?.id === activityId);
    const _isStarred = goal.stargizers?.some((stargizer: any) => stargizer?.id === activityId);
    const _isIssuer = goal.activityId === activityId;

    let parentOwner = false;
    function checkParent(project?: any) {
        if (project?.activityId === activityId) {
            parentOwner = true;
        }

        if (project?.parent?.length) {
            project?.parent.forEach((p: any) => {
                checkParent(p);
            });
        }
    }
    checkParent(goal.project);

    const _isEditable = _isOwner || _isIssuer || parentOwner || role === 'ADMIN';

    return {
        _isOwner,
        _isParticipant,
        _isWatching,
        _isStarred,
        _isIssuer,
        _isEditable,
        ...addCommonCalculatedGoalFields(goal),
    };
};

export const updateProjectUpdatedAt = async (id?: string | null) => {
    if (!id) return;

    return prisma.project.update({
        where: { id },
        data: { id },
    });
};

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

export const email = async ({ template, data }: JobDataMap['email']) => {
    const renderedTemplate = await emailTemplates[template](data);
    return sendMail(renderedTemplate);
};

export const cron = async ({ template }: JobDataMap['cron']) => {
    if (template === 'goalPing') {
        goalPingJob();
    } else {
        throw new Error('No supported cron jobs');
    }
};

export const comment = async ({ activityId, description, goalId }: JobDataMap['comment']) => {
    await createComment({
        description,
        activityId,
        goalId,
        role: 'USER',
        shouldUpdateGoal: false,
    });
};
