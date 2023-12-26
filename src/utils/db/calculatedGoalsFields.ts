import { Role } from '@prisma/client';

import { calcAchievedWeight } from '../recalculateCriteriaScore';

export const addCommonCalculatedGoalFields = (goal: any) => {
    const _shortId = `${goal.projectId}-${goal.scopeId}`;
    const _hasAchievementCriteria = !!goal.goalAchiveCriteria?.length;
    const _achivedCriteriaWeight: number | null =
        goal.completedCriteriaWeight == null && goal.goalAchieveCriteria?.length
            ? calcAchievedWeight(goal.goalAchieveCriteria)
            : goal.completedCriteriaWeight;

    return {
        _shortId,
        _hasAchievementCriteria,
        _achivedCriteriaWeight,
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
