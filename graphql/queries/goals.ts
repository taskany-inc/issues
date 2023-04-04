import { Goal as GoalModel } from '../@generated/genql';

export const goalsFilter = (
    data: {
        query: string;
        priority: string[];
        states: string[];
        tags: string[];
        estimates: string[];
        owner: string[];
    },
    extra: any = {},
): any => {
    const priorityFilter = data.priority.length ? { priority: { in: data.priority } } : {};

    const statesFilter = data.states.length
        ? {
              state: {
                  id: {
                      in: data.states,
                  },
              },
          }
        : {};

    const tagsFilter = data.tags.length
        ? {
              tags: {
                  some: {
                      id: {
                          in: data.tags,
                      },
                  },
              },
          }
        : {};

    const estimateFilter = data.estimates.length
        ? {
              estimate: {
                  some: {
                      OR: data.estimates.map((e) => {
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

    const ownerFilter = data.owner.length
        ? {
              owner: {
                  id: {
                      in: data.owner,
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
                {
                    team: {
                        title: {
                            contains: data.query,
                            mode: 'insensitive',
                        },
                    },
                },
                {
                    team: {
                        description: {
                            contains: data.query,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
            ...priorityFilter,
            ...statesFilter,
            ...tagsFilter,
            ...estimateFilter,
            ...ownerFilter,
            ...extra,
        },
        orderBy: {
            createdAt: 'asc',
        },
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
    team: {
        include: {
            flow: {
                include: {
                    states: true,
                },
            },
        },
    },
    project: {
        include: {
            flow: {
                include: {
                    states: true,
                },
            },
            teams: true,
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
} as const;

export const addCalclulatedGoalsFields = (goal: Partial<GoalModel>, activityId: string) => {
    const _isOwner = goal.ownerId === activityId;
    const _isParticipant = goal.participants?.some((participant) => participant?.id === activityId);
    const _isWatching = goal.watchers?.some((watcher) => watcher?.id === activityId);
    const _isStarred = goal.stargizers?.some((stargizer) => stargizer?.id === activityId);
    const _isIssuer = goal.activityId === activityId;
    const _isEditable = _isOwner || _isIssuer;
    const _lastEstimate = goal.estimate?.length ? goal.estimate[goal.estimate.length - 1] : undefined;

    return {
        _isOwner,
        _isParticipant,
        _isWatching,
        _isStarred,
        _isIssuer,
        _isEditable,
        _lastEstimate,
    };
};

export const calcGoalsMeta = (goals: GoalModel[]) => {
    const uniqTags = new Map();
    const uniqOwners = new Map();
    const uniqParticipants = new Map();
    const uniqIssuers = new Map();
    const uniqPriority = new Set<string>();
    const uniqStates = new Map();
    const uniqProjects = new Map();
    const uniqTeams = new Map();
    const uniqEstimates = new Map();

    goals.forEach((goal: GoalModel) => {
        goal.state && uniqStates.set(goal.state?.id, goal.state);
        goal.priority && uniqPriority.add(goal.priority);

        goal.tags?.forEach((t) => {
            t && uniqTags.set(t.id, t);
        });

        goal.project && uniqProjects.set(goal.project.id, goal.project);
        goal.project?.teams &&
            goal.project?.teams.forEach((t) => {
                t && uniqTeams.set(t.id, t);
            });

        goal.team && uniqTeams.set(goal.team.id, goal.team);

        goal.owner && uniqOwners.set(goal.owner.id, goal.owner);
        goal.participants &&
            goal.participants.forEach((p) => {
                p && uniqParticipants.set(p.id, p);
            });
        goal.activity && uniqIssuers.set(goal.activity.id, goal.activity);

        goal.estimate &&
            goal.estimate.forEach((e) => {
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
        teams: Array.from(uniqTeams.values()),
        estimates: Array.from(uniqEstimates.values()),
        count: goals.length,
    };
};
