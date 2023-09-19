import { Role } from '@prisma/client';

import { QueryWithFilters } from '../../src/schema/common';

import { goalsFilter } from './goals';

export const nonArchivedPartialQuery = {
    OR: [{ archived: null }, { archived: false }],
};

type WithId = { id: string };

export const addCalculatedProjectFields = <
    T extends { watchers?: WithId[]; stargizers?: WithId[]; activityId?: string },
>(
    project: T,
    activityId: string,
    role: Role,
) => {
    const _isWatching = project.watchers?.some((watcher: any) => watcher.id === activityId);
    const _isStarred = project.stargizers?.some((stargizer: any) => stargizer.id === activityId);
    const _isOwner = project.activityId === activityId;
    const _isEditable = _isOwner || role === 'ADMIN';

    return {
        ...project,
        _isWatching,
        _isStarred,
        _isOwner,
        _isEditable,
    };
};

export const getProjectSchema = ({
    goalsQuery,
    activityId,
    firstLevel,
    whereQuery,
}: {
    activityId?: string;
    goalsQuery?: QueryWithFilters;
    firstLevel?: boolean;
    whereQuery?: Record<string, unknown>;
} = {}) => {
    let whereFilter: Record<string, unknown> = { ...whereQuery, ...nonArchivedPartialQuery };

    if (firstLevel) {
        whereFilter = {
            ...whereFilter,
            parent: {
                none: {},
            },
        };
    }
    return {
        include: {
            stargizers: true,
            watchers: true,
            parent: true,
            tags: true,
            children: {
                include: {
                    parent: true,
                },
            },
            participants: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
            activity: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
            _count: {
                select: {
                    stargizers: true,
                    watchers: true,
                    participants: true,
                    children: true,
                    goals:
                        goalsQuery && activityId
                            ? {
                                  where: goalsFilter(goalsQuery, activityId).where,
                              }
                            : true,
                    parent: true,
                },
            },
        },
        where: whereFilter,
    };
};
