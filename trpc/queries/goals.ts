import { Activity, Goal, GoalHistory, Project } from '@prisma/client';

import { QueryWithFilters } from '../../src/schema/common';

const defaultOrderBy = {
    updatedAt: 'desc',
};

// TODO: make it much more type-safety
export const goalsFilter = (data: QueryWithFilters, activityId: string, extra: any = {}): any => {
    const priorityFilter = data.priority?.length ? { priority: { in: data.priority } } : {};

    const statesFilter = data.state?.length
        ? {
              state: {
                  id: {
                      in: data.state,
                  },
              },
          }
        : {};

    const tagsFilter = data.tag?.length
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

    const estimateFilter = data.estimate?.length
        ? {
              estimate: {
                  some: {
                      OR: data.estimate.map((e) => {
                          const [q, y] = e.split('/');

                          return {
                              q,
                              y,
                          };
                      }),
                  },
              },
          }
        : {};

    const ownerFilter = data.owner?.length
        ? {
              owner: {
                  id: {
                      in: data.owner,
                  },
              },
          }
        : {};

    const projectFilter = data.project?.length
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

    const starredFilter = data.starred
        ? {
              stargizers: {
                  some: {
                      id: activityId,
                  },
              },
          }
        : {};

    const watchingFilter = data.watching
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
            ...ownerFilter,
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
        },
    },
    dependsOn: {
        include: {
            state: true,
        },
    },
    relatedTo: {
        include: {
            state: true,
        },
    },
    blocks: {
        include: {
            state: true,
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
            activity: true,
        },
    },
} as const;

export const addCalclulatedGoalsFields = (goal: any, activityId: string) => {
    const _isOwner = goal.ownerId === activityId;
    const _isParticipant = goal.participants?.some((participant: any) => participant?.id === activityId);
    const _isWatching = goal.watchers?.some((watcher: any) => watcher?.id === activityId);
    const _isStarred = goal.stargizers?.some((stargizer: any) => stargizer?.id === activityId);
    const _isIssuer = goal.activityId === activityId;
    const _lastEstimate = goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined;
    const _shortId = `${goal.projectId}-${goal.scopeId}`;

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
            goal.estimate.forEach((e: any) => {
                uniqEstimates.set(`${e?.q}/${e?.y}`, e);
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
