import { Role } from '@prisma/client';

import { QueryWithFilters } from '../../src/schema/common';

import { goalsFilter } from './goals';
import { getProjectAccessFilter } from './access';

export const nonArchivedPartialQuery = {
    OR: [{ archived: null }, { archived: false }],
};

interface WithId {
    id: string;
}

export const addCalculatedProjectFields = <
    T extends {
        watchers?: WithId[];
        participants?: WithId[];
        stargizers?: WithId[];
        activityId?: string;
        personal?: boolean | null;
    },
>(
    project: T,
    activityId: string,
    role: Role,
) => {
    const _isWatching = project.watchers?.some((watcher) => watcher.id === activityId) || false;
    const _isStarred = project.stargizers?.some((stargizer) => stargizer.id === activityId) || false;
    const _isParticipant = project.participants?.some((participant) => participant?.id === activityId);
    const _isOwner = project.activityId === activityId;
    const _isEditable = (_isOwner || _isParticipant || role === 'ADMIN') && !project.personal;

    return {
        ...project,
        _isWatching,
        _isStarred,
        _isOwner,
        _isEditable,
    };
};

export const checkProjectAccess = <
    T extends {
        accessUsers: WithId[];
        activityId: string;
        archived?: boolean | null;
        personal: boolean | null;
        goalAccessIds?: string[];
    },
>(
    project: T,
    activityId: string,
    role: Role,
) => {
    if (role === 'ADMIN') {
        return !project.archived;
    }

    if (project.archived) {
        return false;
    }

    if (project.personal) {
        if (project.goalAccessIds?.length) {
            return project.goalAccessIds.includes(activityId);
        }

        if (project.accessUsers.length) {
            return project.accessUsers.some(({ id }) => id === activityId);
        }

        return project.activityId === activityId;
    }

    if (project.accessUsers.length) {
        return project.accessUsers.some(({ id }) => id === activityId);
    }

    return true;
};

export const getProjectSchema = ({
    role,
    goalsQuery,
    activityId,
    firstLevel,
    whereQuery,
}: {
    role: Role;
    activityId: string;
    goalsQuery?: QueryWithFilters & { hideCriteriaFilterIds?: string[] };
    firstLevel?: boolean;
    whereQuery?: Record<string, unknown>;
}) => {
    const projectAccessQuery = getProjectAccessFilter(activityId, role);

    let whereFilter: Record<string, unknown> = {
        ...whereQuery,
        AND: {
            ...projectAccessQuery,
            ...nonArchivedPartialQuery,
        },
    };

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
                where: projectAccessQuery,
            },
            participants: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
            accessUsers: {
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
            teams: true,
            _count: {
                select: {
                    stargizers: true,
                    watchers: true,
                    participants: true,
                    children: {
                        where: projectAccessQuery,
                    },
                    goals:
                        goalsQuery && activityId
                            ? {
                                  where: goalsFilter(goalsQuery, activityId, role).where,
                              }
                            : true,
                    parent: true,
                },
            },
        },
        where: whereFilter,
    };
};
