import { Role } from '@prisma/client';

import { QueryWithFilters } from '../../src/schema/common';
import { oneOf, and, inverse } from '../../src/utils/anyEntityCheck';

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

interface ProjectAccessEntity {
    accessUsers: WithId[];
    activityId: string;
    archived?: boolean | null;
    personal: boolean | null;
    goalAccessIds?: string[];
}

interface ProjectEntity {
    project: ProjectAccessEntity;
}

interface UserEntity {
    activityId: string;
    role: Role;
}

const notArchivedProject = ({ project }: ProjectEntity & UserEntity) => project.archived !== true;
const projectIsPersonal = ({ project }: ProjectEntity & UserEntity) => project.personal === true;
const userIsProjectOwner = ({ project, activityId }: ProjectEntity & UserEntity) => project.activityId === activityId;

const publicProject = and<ProjectEntity & UserEntity>(
    inverse(projectIsPersonal),
    ({ project }) => project.accessUsers.length === 0 || project.accessUsers == null,
);
const userHadAccess = ({ project, activityId }: ProjectEntity & UserEntity) => {
    if (project.accessUsers.length) {
        return project.accessUsers.some(({ id }) => id === activityId);
    }

    return false;
};
const userHadGoalsInProject = ({ project, activityId }: ProjectEntity & UserEntity) => {
    if (project.goalAccessIds?.length) {
        return project.goalAccessIds.some((id) => id === activityId);
    }

    return false;
};

const checkProjectEntity = and<ProjectEntity & UserEntity>(
    notArchivedProject,
    oneOf(
        and(projectIsPersonal, oneOf(userIsProjectOwner, userHadGoalsInProject)),
        and(inverse(projectIsPersonal), oneOf(userIsProjectOwner, userHadAccess, userHadGoalsInProject)),
        and(inverse(projectIsPersonal), publicProject),
    ),
);

export const checkProjectAccess = <T extends ProjectAccessEntity>(project: T, activityId: string, role: Role) =>
    checkProjectEntity({ project, activityId, role });

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
