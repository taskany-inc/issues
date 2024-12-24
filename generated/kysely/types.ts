import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const Role = {
    USER: 'USER',
    ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const FilterMode = {
    Global: 'Global',
    Project: 'Project',
    User: 'User',
} as const;
export type FilterMode = (typeof FilterMode)[keyof typeof FilterMode];
export const StateType = {
    NotStarted: 'NotStarted',
    InProgress: 'InProgress',
    Completed: 'Completed',
    Failed: 'Failed',
    Canceled: 'Canceled',
} as const;
export type StateType = (typeof StateType)[keyof typeof StateType];
export const DateType = {
    Strict: 'Strict',
    Quarter: 'Quarter',
    Year: 'Year',
} as const;
export type DateType = (typeof DateType)[keyof typeof DateType];
export type Account = {
    id: string;
    userId: string;
    type: string;
    provider: string;
    providerAccountId: string;
    refresh_token: string | null;
    refresh_token_expires_in: number | null;
    access_token: string | null;
    expires_at: number | null;
    token_type: string | null;
    scope: string | null;
    id_token: string | null;
    session_state: string | null;
    oauth_token_secret: string | null;
    oauth_token: string | null;
    password: string | null;
};
export type Activity = {
    id: string;
    ghostId: string | null;
    settingsId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type AppConfig = {
    id: string;
    favicon: string | null;
    logo: string | null;
};
export type Comment = {
    id: string;
    description: string;
    activityId: string;
    goalId: string;
    stateId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type connected = {
    A: string;
    B: string;
};
export type dependsOn = {
    A: string;
    B: string;
};
export type ExternalTask = {
    id: Generated<string>;
    title: string;
    externalId: string;
    externalKey: string;
    project: string;
    projectId: string;
    type: string;
    typeId: string;
    typeIconUrl: string;
    state: string;
    stateId: string;
    stateIconUrl: string;
    stateColor: string | null;
    stateCategoryId: number;
    stateCategoryName: string;
    ownerEmail: string | null;
    ownerName: string | null;
    ownerId: string | null;
    creatorEmail: string | null;
    creatorName: string | null;
    creatorId: string | null;
    assigneeEmail: string | null;
    assigneeName: string | null;
    assigneeId: string | null;
    resolution: string | null;
    resolutionId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Filter = {
    id: string;
    mode: FilterMode;
    title: string;
    description: string | null;
    params: string;
    default: Generated<boolean>;
    activityId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type filterStargizers = {
    A: string;
    B: string;
};
export type Flow = {
    id: string;
    title: string;
    graph: string | null;
    recommended: boolean | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type FlowToState = {
    A: string;
    B: string;
};
export type Ghost = {
    id: string;
    email: string;
    hostId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Goal = {
    id: string;
    scopeId: Generated<number>;
    title: string;
    description: string;
    kind: string | null;
    key: boolean | null;
    personal: boolean | null;
    private: boolean | null;
    archived: Generated<boolean | null>;
    priorityId: string | null;
    estimate: Timestamp | null;
    estimateType: DateType | null;
    projectId: string | null;
    teamId: string | null;
    stateId: string | null;
    activityId: string | null;
    ownerId: string | null;
    completedCriteriaWeight: number | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type GoalAchieveCriteria = {
    id: string;
    goalId: string;
    title: string;
    weight: number;
    isDone: Generated<boolean>;
    activityId: string;
    deleted: boolean | null;
    criteriaGoalId: string | null;
    externalTaskId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type GoalHistory = {
    id: string;
    goalId: string;
    subject: string;
    action: string;
    previousValue: string | null;
    nextValue: string | null;
    activityId: string;
    createdAt: Generated<Timestamp>;
};
export type goalParticipants = {
    A: string;
    B: string;
};
export type GoalRank = {
    id: Generated<string>;
    activityId: string | null;
    goalId: string;
    value: number;
};
export type goalStargizers = {
    A: string;
    B: string;
};
export type GoalToTag = {
    A: string;
    B: string;
};
export type goalWatchers = {
    A: string;
    B: string;
};
export type Job = {
    id: string;
    state: string;
    priority: Generated<number>;
    kind: string;
    data: unknown;
    delay: number | null;
    retry: number | null;
    runs: Generated<number>;
    force: Generated<boolean>;
    cron: string | null;
    error: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type parentChildren = {
    A: string;
    B: string;
};
export type partnershipProjects = {
    A: string;
    B: string;
};
export type Priority = {
    id: string;
    title: string;
    value: number;
    default: Generated<boolean>;
};
export type Project = {
    id: string;
    title: string;
    description: string | null;
    activityId: string;
    flowId: string;
    averageScore: number | null;
    personal: Generated<boolean | null>;
    archived: Generated<boolean | null>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type projectAccess = {
    A: string;
    B: string;
};
export type projectParticipants = {
    A: string;
    B: string;
};
export type projects = {
    A: string;
    B: string;
};
export type projectStargizers = {
    A: string;
    B: string;
};
export type ProjectToTag = {
    A: string;
    B: string;
};
export type projectWatchers = {
    A: string;
    B: string;
};
export type Reaction = {
    id: string;
    emoji: string;
    activityId: string;
    goalId: string | null;
    commentId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Release = {
    id: string;
    version: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type releasesDelayed = {
    A: string;
    B: string;
};
export type releasesRead = {
    A: string;
    B: string;
};
export type Session = {
    id: string;
    sessionToken: string;
    userId: string;
    expires: Timestamp;
};
export type Settings = {
    id: string;
    theme: Generated<string>;
    beta: Generated<boolean>;
    flowId: string | null;
    locale: Generated<string>;
    enableEmailNotify: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type State = {
    id: string;
    title: string;
    type: StateType;
    default: boolean | null;
    order: Generated<number>;
    hue: Generated<number>;
    lightForeground: string | null;
    lightBackground: string | null;
    darkForeground: string | null;
    darkBackground: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Tag = {
    id: string;
    title: string;
    description: string | null;
    activityId: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type Team = {
    id: string;
    externalTeamId: string;
};
export type User = {
    id: string;
    active: Generated<boolean>;
    nickname: string | null;
    name: string | null;
    email: string;
    emailVerified: Timestamp | null;
    image: string | null;
    role: Generated<Role>;
    hostId: string | null;
    invitedAt: Timestamp | null;
    activityId: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
};
export type VerificationToken = {
    identifier: string;
    token: string;
    expires: Timestamp;
};
export type DB = {
    _connected: connected;
    _dependsOn: dependsOn;
    _filterStargizers: filterStargizers;
    _FlowToState: FlowToState;
    _goalParticipants: goalParticipants;
    _goalStargizers: goalStargizers;
    _GoalToTag: GoalToTag;
    _goalWatchers: goalWatchers;
    _parentChildren: parentChildren;
    _partnershipProjects: partnershipProjects;
    _projectAccess: projectAccess;
    _projectParticipants: projectParticipants;
    _projects: projects;
    _projectStargizers: projectStargizers;
    _ProjectToTag: ProjectToTag;
    _projectWatchers: projectWatchers;
    _releasesDelayed: releasesDelayed;
    _releasesRead: releasesRead;
    Account: Account;
    Activity: Activity;
    AppConfig: AppConfig;
    Comment: Comment;
    ExternalTask: ExternalTask;
    Filter: Filter;
    Flow: Flow;
    Ghost: Ghost;
    Goal: Goal;
    GoalAchieveCriteria: GoalAchieveCriteria;
    GoalHistory: GoalHistory;
    GoalRank: GoalRank;
    Job: Job;
    Priority: Priority;
    Project: Project;
    Reaction: Reaction;
    Release: Release;
    Session: Session;
    Settings: Settings;
    State: State;
    Tag: Tag;
    Team: Team;
    User: User;
    VerificationToken: VerificationToken;
};
