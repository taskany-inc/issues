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
    goalsQuery,
    activityId,
    firstLevel,
    whereQuery,
}: {
    activityId: string;
    goalsQuery?: QueryWithFilters & { hideCriteriaFilterIds?: string[] };
    firstLevel?: boolean;
    whereQuery?: Record<string, unknown>;
}) => {
    const projectAccessQuery = getProjectAccessFilter(activityId);

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
