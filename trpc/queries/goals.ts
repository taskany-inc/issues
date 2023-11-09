import { Goal, GoalAchieveCriteria, Prisma, Role, State, StateType } from '@prisma/client';

import { QueryWithFilters } from '../../src/schema/common';
import { decodeUrlDateRange, getDateString } from '../../src/utils/dateTime';

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
    data: QueryWithFilters,
    activityId: string,
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

    const projectFilter: Prisma.GoalFindManyArgs['where'] = data.project?.length
        ? {
              OR: [
                  {
                      project: {
                          id: {
                              in: data.project,
                          },
                      },
                  },
                  {
                      project: {
                          parent: {
                              some: {
                                  id: {
                                      in: data.project,
                                  },
                              },
                          },
                      },
                  },
              ],
          }
        : {};

    let orderBy: any = [];

    if (data.sort?.updatedAt) {
        orderBy = [{ updatedAt: data.sort.updatedAt }];
    }

    if (data.sort?.createdAt) {
        orderBy.push({
            createdAt: data.sort.createdAt,
        });
    }

    if (data.sort?.title) {
        orderBy.push({
            title: data.sort.title,
        });
    }

    if (data.sort?.priority) {
        orderBy.push({
            priority: {
                value: data.sort.priority,
            },
        });
    }

    if (data.sort?.state) {
        orderBy.push({
            state: {
                title: data.sort.state,
            },
        });
    }

    if (data.sort?.project) {
        orderBy.push({
            project: {
                title: data.sort.project,
            },
        });
    }

    if (data.sort?.activity) {
        orderBy.push({
            activity: {
                user: {
                    name: data.sort.activity,
                },
            },
        });
    }

    if (data.sort?.owner) {
        orderBy.push({
            owner: {
                user: {
                    name: data.sort.owner,
                },
            },
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
            ...extra,
        },
        orderBy: orderBy.length ? orderBy : defaultOrderBy,
    };
};

export const goalDeepQuery = {
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
            parent: true,
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
            goalAsCriteria: {
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
        },
        orderBy: {
            createdAt: 'asc',
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
        where: nonArchievedGoalsPartialQuery,
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
        where: nonArchievedGoalsPartialQuery,
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
        where: nonArchievedGoalsPartialQuery,
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
        where: nonArchievedGoalsPartialQuery,
    },
    comments: {
        orderBy: {
            createdAt: 'asc',
        },
        include: {
            activity: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
            state: true,
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
        },
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

const maxPossibleCriteriaWeight = 100;

export const calcAchievedWeight = (
    list: (GoalAchieveCriteria & { goalAsCriteria: (Goal & { state: State | null }) | null })[],
): number => {
    const { achivedWithWeight, comletedWithoutWeight, anyWithoutWeight, allWeight } = list.reduce(
        (acc, value) => {
            // `where` filter by `deleted` field doesn't work in *Many queries
            if (value.deleted) {
                return acc;
            }

            acc.allWeight += value.weight;

            if (!value.weight) {
                acc.anyWithoutWeight += 1;
            }
            if (value.isDone || (value.goalAsCriteria && value.goalAsCriteria.state?.type === StateType.Completed)) {
                acc.achivedWithWeight += value.weight;

                if (!value.weight) {
                    acc.comletedWithoutWeight += 1;
                }
            }

            return acc;
        },
        { achivedWithWeight: 0, comletedWithoutWeight: 0, anyWithoutWeight: 0, allWeight: 0 },
    );

    const remainingtWeight = maxPossibleCriteriaWeight - allWeight;
    const quantityByWeightlessCriteria = anyWithoutWeight > 0 ? remainingtWeight / anyWithoutWeight : 0;

    return Math.min(
        achivedWithWeight + Math.ceil(quantityByWeightlessCriteria * comletedWithoutWeight),
        maxPossibleCriteriaWeight,
    );
};

export const addCalculatedGoalsFields = (goal: any, activityId: string, role: Role) => {
    const _isOwner = goal.ownerId === activityId;
    const _isParticipant = goal.participants?.some((participant: any) => participant?.id === activityId);
    const _isWatching = goal.watchers?.some((watcher: any) => watcher?.id === activityId);
    const _isStarred = goal.stargizers?.some((stargizer: any) => stargizer?.id === activityId);
    const _isIssuer = goal.activityId === activityId;
    const _shortId = `${goal.projectId}-${goal.scopeId}`;
    const _hasAchievementCriteria = !!goal.goalAchiveCriteria?.length;
    const _achivedCriteriaWeight: number | null =
        goal.completedCriteriaWeight == null && goal.goalAchieveCriteria
            ? calcAchievedWeight(goal.goalAchieveCriteria)
            : goal.completedCriteriaWeight;

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
        _shortId,
        _hasAchievementCriteria,
        _achivedCriteriaWeight,
    };
};

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
