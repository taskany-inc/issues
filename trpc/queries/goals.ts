import { Prisma, Role, StateType } from '@prisma/client';
import { decodeUrlDateRange, getDateString } from '@taskany/bricks';

import { QueryWithFilters } from '../../src/schema/common';

import { getProjectAccessFilter } from './access';

const defaultOrderBy = {
    updatedAt: 'desc',
};

export const nonArchievedGoalsPartialQuery = {
    archived: { not: true },
};

const getStateFilter = (data: QueryWithFilters): Prisma.GoalFindManyArgs['where'] => {
    const state: Prisma.GoalFindManyArgs['where'] = {};
    const stateTypes = (data.stateType?.filter((data) => data in StateType) || []) as StateType[];

    if (!data.state?.length && !stateTypes.length) {
        return {};
    }

    state.state = {};

    if (stateTypes.length) {
        state.state.type = {
            in: stateTypes,
        };
    }

    if (data.state?.length) {
        state.state.id = {
            in: data.state,
        };
    }

    return state;
};

const getEstimateFilter = (data: QueryWithFilters): Prisma.GoalFindManyArgs['where'] => {
    const state: Prisma.GoalFindManyArgs['where'] = {};

    if (data.estimate?.length) {
        return {
            AND: {
                OR: data.estimate.reduce<
                    {
                        estimate:
                            | {
                                  lte: Date | undefined;
                                  gte: Date | undefined;
                              }
                            | {
                                  in: Date;
                              };
                    }[]
                >((acum, e) => {
                    const estimate = decodeUrlDateRange(e);

                    if (estimate) {
                        const end = new Date(getDateString(estimate.end));
                        const start = estimate.start ? new Date(getDateString(estimate.start)) : null;

                        acum.push({
                            estimate: start
                                ? {
                                      gte: start,
                                      lte: end,
                                  }
                                : {
                                      in: end,
                                  },
                        });
                    }

                    return acum;
                }, []),
            },
        };
    }

    return state;
};

export const goalsFilter = (
    data: QueryWithFilters & { hideCriteriaFilterIds?: string[] },
    activityId: string,
    role: Role,
    extra: Prisma.GoalFindManyArgs['where'] = {},
): {
    where: Prisma.GoalFindManyArgs['where'];
    orderBy: Prisma.GoalFindManyArgs['orderBy'];
} => {
    const priorityFilter = data.priority?.length
        ? {
              priority: {
                  id: { in: data.priority },
              },
          }
        : {};

    const statesFilter: Prisma.GoalFindManyArgs['where'] = getStateFilter(data);

    const tagsFilter: Prisma.GoalFindManyArgs['where'] = data.tag?.length
        ? {
              tags: {
                  some: {
                      id: {
                          in: data.tag,
                      },
                  },
              },
          }
        : {};

    const estimateFilter: Prisma.GoalFindManyArgs['where'] = getEstimateFilter(data);

    const issuerFilter: Prisma.GoalFindManyArgs['where'] = data.issuer?.length
        ? {
              activity: {
                  id: {
                      in: data.issuer,
                  },
              },
          }
        : {};

    const ownerFilter: Prisma.GoalFindManyArgs['where'] = data.owner?.length
        ? {
              owner: {
                  id: {
                      in: data.owner,
                  },
              },
          }
        : {};

    const participantFilter: Prisma.GoalFindManyArgs['where'] = data.participant?.length
        ? {
              participants: {
                  some: {
                      id: {
                          in: data.participant,
                      },
                  },
              },
          }
        : {};

    const partnershipProjectFilter: Prisma.GoalFindManyArgs['where'] = data.partnershipProject?.length
        ? {
              partnershipProjects: {
                  some: {
                      id: {
                          in: data.partnershipProject,
                      },
                  },
              },
          }
        : {};

    const projectAccessFilter = getProjectAccessFilter(activityId, role);
    const projectFilter: Prisma.GoalFindManyArgs['where'] = data.project?.length
        ? {
              OR: [
                  {
                      project: {
                          id: {
                              in: data.project,
                          },
                          ...projectAccessFilter,
                      },
                  },
                  {
                      project: {
                          parent: {
                              some: {
                                  id: {
                                      in: data.project,
                                  },
                                  ...projectAccessFilter,
                              },
                          },
                      },
                  },
              ],
          }
        : {
              project: {
                  ...projectAccessFilter,
              },
          };

    const criteriaFilter: Prisma.GoalFindManyArgs['where'] = data.hideCriteria
        ? {
              id: { not: { in: data.hideCriteriaFilterIds } },
          }
        : {};

    const orderBy: any = [];

    if (data.sort) {
        const mapToSortedField = {
            title: undefined,
            createdAt: undefined,
            updatedAt: undefined,
            state: {
                asc: { title: 'asc' },
                desc: { title: 'desc' },
            },
            priority: {
                asc: { value: 'asc' },
                desc: { value: 'desc' },
            },
            project: {
                asc: { title: 'asc' },
                desc: { title: 'desc' },
            },
            activity: {
                asc: { user: { name: 'asc' } },
                desc: { user: { name: 'desc' } },
            },
            owner: {
                asc: { user: { name: 'asc' } },
                desc: { user: { name: 'desc' } },
            },
            rank: undefined,
            rankGlobal: undefined,
        };
        data.sort.forEach(({ key, dir }) => {
            if (key === 'rank') return;
            const sortField = mapToSortedField[key];
            if (sortField == null) {
                orderBy.push({ [key]: dir });
            } else {
                orderBy.push({ [key]: sortField[dir] });
            }
        });
    }

    const starredFilter: Prisma.GoalFindManyArgs['where'] = data.starred
        ? {
              stargizers: {
                  some: {
                      id: activityId,
                  },
              },
          }
        : {};

    const watchingFilter: Prisma.GoalFindManyArgs['where'] = data.watching
        ? {
              watchers: {
                  some: {
                      id: activityId,
                  },
              },
          }
        : {};

    return {
        where: {
            ...nonArchievedGoalsPartialQuery,
            OR: [
                {
                    title: {
                        contains: data.query,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: data.query,
                        mode: 'insensitive',
                    },
                },
                {
                    project: {
                        title: {
                            contains: data.query,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    project: {
                        description: {
                            contains: data.query,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
            ...partnershipProjectFilter,
            ...starredFilter,
            ...watchingFilter,
            ...priorityFilter,
            ...statesFilter,
            ...tagsFilter,
            ...estimateFilter,
            ...issuerFilter,
            ...ownerFilter,
            ...participantFilter,
            ...projectFilter,
            ...criteriaFilter,
            ...extra,
        },
        orderBy: orderBy.length ? orderBy : defaultOrderBy,
    };
};

export const getGoalDeepQuery = (user?: { activityId: string; role: Role }) => {
    const depsWhere = {
        ...(user
            ? {
                  project: {
                      ...getProjectAccessFilter(user.activityId, user.role),
                  },
              }
            : {}),
        ...nonArchievedGoalsPartialQuery,
    };

    return {
        owner: {
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
        tags: true,
        state: true,
        priority: true,
        project: {
            include: {
                parent: {
                    include: {
                        participants: true,
                    },
                },
                tags: true,
                flow: {
                    include: {
                        states: true,
                    },
                },
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
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
                stargizers: true,
                watchers: true,
                children: {
                    include: {
                        parent: true,
                    },
                },
                _count: {
                    select: {
                        stargizers: true,
                        watchers: true,
                        participants: true,
                        children: true,
                        goals: true,
                        parent: true,
                    },
                },
            },
        },
        partnershipProjects: {
            include: {
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                participants: {
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
                        goals: true,
                        parent: true,
                    },
                },
            },
        },
        goalAchiveCriteria: {
            include: {
                criteriaGoal: {
                    include: {
                        activity: {
                            include: {
                                user: true,
                                ghost: true,
                            },
                        },
                        owner: {
                            include: {
                                user: true,
                                ghost: true,
                            },
                        },
                        state: true,
                    },
                },
                externalTask: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
            where: {
                deleted: { not: true },
            },
        },
        dependsOn: {
            include: {
                state: true,
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                owner: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
            where: depsWhere,
        },
        relatedTo: {
            include: {
                state: true,
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                owner: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
            where: depsWhere,
        },
        blocks: {
            include: {
                state: true,
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                owner: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
            where: depsWhere,
        },
        connected: {
            include: {
                state: true,
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
                owner: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
            where: depsWhere,
        },
        reactions: {
            include: {
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
        },
        stargizers: {
            include: {
                user: true,
                ghost: true,
            },
        },
        watchers: {
            include: {
                user: true,
                ghost: true,
            },
        },
        participants: {
            include: {
                user: true,
                ghost: true,
            },
        },
        _count: {
            select: {
                stargizers: true,
                watchers: true,
                comments: true,
            },
        },
        history: {
            include: {
                activity: {
                    include: {
                        user: true,
                        ghost: true,
                    },
                },
            },
        },
    } as const;
};

export const goalDeepQuery = getGoalDeepQuery();

export const calcGoalsMeta = (goals: any[]) => {
    const uniqTags = new Map();
    const uniqOwners = new Map();
    const uniqParticipants = new Map();
    const uniqIssuers = new Map();
    const uniqPriority = new Map();
    const uniqStates = new Map();
    const uniqProjects = new Map();

    goals.forEach((goal: any) => {
        goal.state && uniqStates.set(goal.state?.id, goal.state);
        goal.priority && uniqPriority.set(goal.priority.id, goal.priority);

        goal.tags?.forEach((t: any) => {
            t && uniqTags.set(t.id, t);
        });

        goal.project && uniqProjects.set(goal.project.id, goal.project);

        goal.owner && uniqOwners.set(goal.owner.id, goal.owner);
        goal.participants &&
            goal.participants.forEach((p: any) => {
                p && uniqParticipants.set(p.id, p);
            });
        goal.activity && uniqIssuers.set(goal.activity.id, goal.activity);
    });

    return {
        tags: Array.from(uniqTags.values()),
        owners: Array.from(uniqOwners.values()),
        participants: Array.from(uniqParticipants.values()),
        issuers: Array.from(uniqIssuers.values()),
        priority: Array.from(uniqPriority),
        states: Array.from(uniqStates.values()),
        projects: Array.from(uniqProjects.values()),
        count: goals.length,
    };
};
