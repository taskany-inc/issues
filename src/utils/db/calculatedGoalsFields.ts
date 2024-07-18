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

interface WithId {
    id: string;
}

export const addCalculatedGoalsFields = <
    T extends {
        ownerId: string | null;
        participants?: WithId[];
        watchers?: WithId[];
        stargizers?: WithId[];
        activityId: string | null;
        project?: P | null;
    },
    P extends {
        participants?: WithId[];
        activityId: string | null;
        parent?: P[];
    },
>(
    goal: T,
    activityId: string,
    role: Role,
) => {
    const _isOwner = goal.ownerId === activityId;
    const _isParticipant = goal.participants?.some((participant) => participant?.id === activityId);
    const _isWatching = goal.watchers?.some((watcher) => watcher?.id === activityId);
    const _isStarred = goal.stargizers?.some((stargizer) => stargizer?.id === activityId);
    const _isIssuer = goal.activityId === activityId;

    const parentOwner = goal.project?.activityId === activityId;
    const parentParticipant = goal.project?.participants?.some(
        (participant: { id: string }) => participant?.id === activityId,
    );

    const _isEditable = _isParticipant || parentParticipant || _isOwner || _isIssuer || parentOwner || role === 'ADMIN';

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
