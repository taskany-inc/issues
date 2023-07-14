import { Estimate, EstimateToGoal, Goal, GoalAchieveCriteria, Prisma, State, StateType } from '@prisma/client';

import { QueryWithFilters } from '../../src/schema/common';

const defaultOrderBy = {
    updatedAt: 'desc',
};

export const goalsFilter = (
    data: QueryWithFilters,
    activityId: string,
    extra: Prisma.GoalFindManyArgs['where'] = {},
): {
    where: Prisma.GoalFindManyArgs['where'];
    orderBy: Prisma.GoalFindManyArgs['orderBy'];
} => {
    const priorityFilter = data.priority?.length ? { priority: { in: data.priority } } : {};

    const statesFilter: Prisma.GoalFindManyArgs['where'] = data.state?.length
        ? {
              state: {
                  id: {
                      in: data.state,
                  },
              },
          }
        : {};

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

    const estimateFilter: Prisma.GoalFindManyArgs['where'] = data.estimate?.length
        ? {
              estimate: {
                  some: {
                      estimate: {
                          OR: data.estimate.map((e) => {
                              const [q, y] = e.split('/');

                              return {
                                  q,
                                  y,
                              };
                          }),
                      },
                  },
              },
          }
        : {};

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
              project: {
                  id: {
                      in: data.project,
                  },
              },
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
            priority: data.sort.priority,
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
            archived: false,
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
    estimate: true,
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
    goalAchiveCriteria: {
        include: {
            goalAsCriteria: {
                include: {
                    estimate: { include: { estimate: true } },
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
            estimate: { include: { estimate: true } },
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
    },
    relatedTo: {
        include: {
            state: true,
            estimate: { include: { estimate: true } },
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
    },
    blocks: {
        include: {
            state: true,
            estimate: { include: { estimate: true } },
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
                },
            },
        },
    },
} as const;

const maxPossibleCriteriaWeight = 100;

const calcAchievedWeight = (list: (GoalAchieveCriteria & { goalAsCriteria: Goal & { state: State } })[]): number => {
    const { achivedWithWeight, comletedWithoutWeight, anyWithoutWeight, allWeight } = list.reduce(
        (acc, value) => {
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
    const quantityByWeightlessCriteria = remainingtWeight / anyWithoutWeight;

    return Math.min(
        achivedWithWeight + Math.ceil(quantityByWeightlessCriteria * comletedWithoutWeight),
        maxPossibleCriteriaWeight,
    );
};

export const addCalclulatedGoalsFields = (goal: any, activityId: string) => {
    const _isOwner = goal.ownerId === activityId;
    const _isParticipant = goal.participants?.some((participant: any) => participant?.id === activityId);
    const _isWatching = goal.watchers?.some((watcher: any) => watcher?.id === activityId);
    const _isStarred = goal.stargizers?.some((stargizer: any) => stargizer?.id === activityId);
    const _isIssuer = goal.activityId === activityId;
    const _lastEstimate = goal.estimate?.length ? goal.estimate[goal.estimate.length - 1].estimate : undefined;
    const _shortId = `${goal.projectId}-${goal.scopeId}`;
    const _hasAchievementCriteria = goal.goalAchiveCriteria?.length;
    const _achivedCriteriaWeight = calcAchievedWeight(goal.goalAchiveCriteria ?? []);

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

    const _isEditable = _isOwner || _isIssuer || parentOwner;

    return {
        _isOwner,
        _isParticipant,
        _isWatching,
        _isStarred,
        _isIssuer,
        _isEditable,
        _lastEstimate,
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
    const uniqPriority = new Set<string>();
    const uniqStates = new Map();
    const uniqProjects = new Map();
    const uniqEstimates = new Map();

    goals.forEach((goal: any) => {
        goal.state && uniqStates.set(goal.state?.id, goal.state);
        goal.priority && uniqPriority.add(goal.priority);

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

        goal.estimate &&
            goal.estimate.forEach(({ estimate }: EstimateToGoal & { estimate: Estimate }) => {
                uniqEstimates.set(`${estimate?.q}/${estimate?.y}`, estimate);
            });
    });

    return {
        tags: Array.from(uniqTags.values()),
        owners: Array.from(uniqOwners.values()),
        participants: Array.from(uniqParticipants.values()),
        issuers: Array.from(uniqIssuers.values()),
        priority: Array.from(uniqPriority),
        states: Array.from(uniqStates.values()),
        projects: Array.from(uniqProjects.values()),
        estimates: Array.from(uniqEstimates.values()),
        count: goals.length,
    };
};

export const getEstimateListFormJoin = <
    T extends Goal & { estimate?: Array<EstimateToGoal & { estimate?: Estimate }> },
>(
    goal: T,
): Estimate[] | null => {
    const { estimate } = goal;

    if (estimate == null || !estimate.length) {
        return null;
    }

    return estimate.reduce<Estimate[]>((acc, value) => {
        if (value.estimate != null) {
            acc.push(value.estimate);
        }

        return acc;
    }, []);
};
