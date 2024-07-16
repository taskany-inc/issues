import { Activity, Reaction, Role, User, Ghost, Comment, State } from '@prisma/client';

import { calcAchievedWeight } from '../recalculateCriteriaScore';
import { ReactionsMap } from '../../types/reactions';
import { safeGetUserName } from '../getUserName';

interface UserActivity {
    activity: Activity & { user: User; ghost: Ghost | null };
}

export const addCommonCalculatedGoalFields = (goal: any) => {
    const _shortId = `${goal.projectId}-${goal.scopeId}`;
    const _hasAchievementCriteria = !!goal.goalAchiveCriteria?.length;
    const _achivedCriteriaWeight: number | null =
        goal.completedCriteriaWeight == null && goal.goalAchieveCriteria?.length
            ? calcAchievedWeight(goal.goalAchieveCriteria)
            : goal.completedCriteriaWeight;

    const lastCommentWithUpdateState: Comment &
        UserActivity & { reactions: (Reaction & UserActivity)[]; state: State } = goal.comments?.[0];

    let reactions: ReactionsMap = {};
    if (lastCommentWithUpdateState) {
        const limit = 10;
        reactions = lastCommentWithUpdateState.reactions?.reduce<ReactionsMap>((acc, cur) => {
            const data = {
                activityId: cur.activityId,
                name: safeGetUserName(cur.activity),
            };

            if (acc[cur.emoji]) {
                acc[cur.emoji].count += 1;
                acc[cur.emoji].authors.push(data);
            } else {
                acc[cur.emoji] = {
                    count: 1,
                    authors: [data],
                    remains: 0,
                };
            }

            return acc;
        }, {});

        for (const key in reactions) {
            if (key in reactions) {
                const { authors } = reactions[key];

                if (authors.length > limit) {
                    reactions[key].authors = authors.slice(0, limit);
                    reactions[key].remains = authors.length - limit;
                }
            }
        }
    }

    return {
        _shortId,
        _hasAchievementCriteria,
        _achivedCriteriaWeight,
        _lastComment: {
            ...lastCommentWithUpdateState,
            reactions,
        },
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
