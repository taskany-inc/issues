import { Role } from '@prisma/client';

import { calcAchievedWeight } from '../recalculateCriteriaScore';
import { getShortId } from '../getShortId';
import { jiraService } from '../integration/jira';

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

// in this case type of Prisma & Kysely model of GoalAchieveCriteria is different and cannot matched between both
// TODO: fix any type annotation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const calculateGoalCriteria = (list: Array<any>) => {
    const taskStatusColorMap = jiraService.config?.mapStatusIdToColor;

    return list.map(({ criteriaGoal, externalTask, ...criteria }) => {
        const baseCriteria = {
            ...criteria,
            criteriaGoal: null,
            externalTask: null,
        };

        if (criteriaGoal != null) {
            return {
                ...baseCriteria,
                criteriaGoal: {
                    ...criteriaGoal,
                    _shortId: getShortId(criteriaGoal),
                },
            };
        }

        if (externalTask) {
            let color = taskStatusColorMap?.default;

            const isFinishedStatus = jiraService.checkStatusIsFinished(externalTask.stateCategoryId);
            if (isFinishedStatus) {
                const isPositiveStatus = jiraService.positiveStatuses?.includes(externalTask.state) || false;

                color = isPositiveStatus ? taskStatusColorMap?.complete : taskStatusColorMap?.failed;
            } else if (jiraService.config?.mapStatusKey != null) {
                const colorKey = jiraService.config.mapStatusKey[
                    externalTask.stateCategoryId
                ] as keyof typeof taskStatusColorMap;
                color = taskStatusColorMap?.[colorKey];
            }

            return {
                ...baseCriteria,
                // mark undone criteria as done if task in finished status
                isDone: baseCriteria.isDone || isFinishedStatus,
                externalTask: {
                    ...externalTask,
                    stateColor: color,
                },
                criteriaGoal: null,
            };
        }

        return baseCriteria;
    });
};
