/* eslint-disable @typescript-eslint/no-use-before-define */
import { asNexusMethod, objectType, inputObjectType, enumType, nonNull } from 'nexus';
import { DateTimeResolver } from 'graphql-scalars';
import {
    User as UserModel,
    Project as ProjectModel,
    Team as TeamModel,
    Ghost as GhostModel,
    Activity as ActivityModel,
    Goal as GoalModel,
    Estimate as EstimateModel,
    Flow as FlowModel,
    State as StateModel,
    Tag as TagModel,
    Settings as SettingsModel,
    Reaction as ReactionModel,
    Comment as CommentModel,
} from 'nexus-prisma';

export const DateTime = asNexusMethod(DateTimeResolver, 'DateTime');

export const SortOrder = enumType({
    name: 'SortOrder',
    members: ['asc', 'desc'],
});

export const Role = enumType({
    name: 'Role',
    members: ['USER', 'ADMIN'],
});

export const dependencyKind = ['dependsOn', 'blocks', 'relatedTo'];
export const Dependency = enumType({
    name: 'Dependency',
    members: dependencyKind,
});

export const User = objectType({
    name: UserModel.$name,
    definition(t) {
        t.field(UserModel.id);
        t.field(UserModel.email);
        t.field(UserModel.nickname);
        t.field(UserModel.name);
        t.field(UserModel.image);
        t.field(UserModel.activityId);
        t.field('activity', { type: Activity });
        t.field(UserModel.role);
        t.field(UserModel.createdAt);
        t.field(UserModel.updatedAt);
    },
});

export const Activity = objectType({
    name: ActivityModel.$name,
    definition(t) {
        t.field(ActivityModel.id);
        t.field('user', { type: User });
        t.field('ghost', { type: Ghost });
        t.field('settings', { type: Settings });
        t.list.field('tags', { type: Tag });
        t.field(ActivityModel.createdAt);
        t.field(ActivityModel.updatedAt);
    },
});

export const Ghost = objectType({
    name: GhostModel.$name,
    definition(t) {
        t.field(GhostModel.id);
        t.field(GhostModel.email);
        t.field('host', { type: User });
        t.field(GhostModel.hostId);
        t.field('user', { type: User });
        t.field(GhostModel.createdAt);
        t.field(GhostModel.updatedAt);
        t.field('activity', { type: Activity });
    },
});

export const Project = objectType({
    name: ProjectModel.$name,
    definition(t) {
        t.field(ProjectModel.id);
        t.field(ProjectModel.key);
        t.field(ProjectModel.title);
        t.field(ProjectModel.description);
        t.field(ProjectModel.activityId);
        t.field('activity', { type: Activity });
        t.field(ProjectModel.flowId);
        t.field('flow', { type: Flow });
        t.field('parent', { type: Project });
        t.list.field('children', { type: Project });
        t.list.field('teams', { type: nonNull(Team) });
        t.list.field('goals', { type: Goal });
        t.list.field('tags', { type: Tag });
        t.list.field('participants', { type: Activity });
        t.list.field('watchers', { type: Activity });
        t.list.field('stargizers', { type: Activity });
        t.field(ProjectModel.createdAt);
        t.field(ProjectModel.updatedAt);

        // calculated fields
        t.field('_count', { type: ProjectAggregation });
        t.boolean('_isStarred');
        t.boolean('_isWatching');
    },
});

export const ProjectAggregation = objectType({
    name: 'ProjectAggregation',
    definition(t) {
        t.int('stargizers');
    },
});

export const Team = objectType({
    name: TeamModel.$name,
    definition(t) {
        t.field(TeamModel.id);
        t.field(TeamModel.key);
        t.field(TeamModel.title);
        t.field(TeamModel.description);
        t.field(TeamModel.activityId);
        t.field(TeamModel.flowId);
        t.field('flow', { type: Flow });
        t.field('activity', { type: Activity });
        t.field('parent', { type: Team });
        t.list.field('children', { type: Team });
        t.list.field('goals', { type: Goal });
        t.list.field('projects', { type: Project });
        t.list.field('participants', { type: Activity });
        t.list.field('watchers', { type: Activity });
        t.list.field('stargizers', { type: Activity });
        t.field(TeamModel.createdAt);
        t.field(TeamModel.updatedAt);

        // calculated fields
        t.field('_count', { type: TeamAggregation });
    },
});

export const TeamAggregation = objectType({
    name: 'TeamAggregation',
    definition(t) {
        t.int('projects');
        t.int('participants');
    },
});

export const Goal = objectType({
    name: GoalModel.$name,
    definition(t) {
        t.field(GoalModel.id);
        t.field(GoalModel.title);
        t.field(GoalModel.description);
        t.field(GoalModel.kind);
        t.field(GoalModel.key);
        t.field(GoalModel.personal);
        t.field(GoalModel.private);
        t.field(GoalModel.archived);
        t.field(GoalModel.priority);
        t.list.field('estimate', { type: Estimate });
        t.field(GoalModel.createdAt);
        t.field(GoalModel.updatedAt);
        t.field(GoalModel.activityId);
        t.field('activity', { type: Activity });
        t.field('owner', { type: Activity });
        t.field(GoalModel.ownerId);
        t.list.field('participants', { type: Activity });
        t.list.field('watchers', { type: Activity });
        t.list.field('stargizers', { type: Activity });
        t.list.field('reactions', { type: Reaction });
        t.field(GoalModel.projectId);
        t.field('project', { type: Project });
        t.field(GoalModel.teamId);
        t.field('team', { type: Team });
        t.field(GoalModel.stateId);
        t.field('state', { type: State });
        t.list.field('tags', { type: Tag });
        t.list.field('dependsOn', { type: Goal });
        t.list.field('blocks', { type: Goal });
        t.list.field('relatedTo', { type: Goal });
        t.list.field('connected', { type: Goal });
        t.list.field('comments', { type: Comment });

        // calculated fields
        t.field('_count', { type: GoalAggregation });
        t.boolean('_isStarred');
        t.boolean('_isWatching');
        t.boolean('_isOwner');
        t.boolean('_isIssuer');
        t.boolean('_isParticipant');
        t.boolean('_isEditable');
        t.field('_lastEstimate', { type: Estimate });
    },
});

export const GoalAggregation = objectType({
    name: 'GoalAggregation',
    definition(t) {
        t.int('stargizers');
        t.int('watchers');
        t.int('comments');
    },
});

export const Estimate = objectType({
    name: EstimateModel.$name,
    definition(t) {
        t.field(EstimateModel.id);
        t.field(EstimateModel.y);
        t.field(EstimateModel.q);
        t.field(EstimateModel.date);
        t.field(EstimateModel.activityId);
        t.field('activity', { type: Activity });
    },
});

export const Flow = objectType({
    name: FlowModel.$name,
    definition(t) {
        t.field(FlowModel.id);
        t.field(FlowModel.title);
        t.field(FlowModel.graph);
        t.list.field('projects', { type: Project });
        t.list.field('states', { type: State });
    },
});

export const State = objectType({
    name: StateModel.$name,
    definition(t) {
        t.field(StateModel.id);
        t.field(StateModel.title);
        t.field(StateModel.hue);
        t.field(StateModel.default);
        t.list.field('flows', { type: Flow });
    },
});

export const Tag = objectType({
    name: TagModel.$name,
    definition(t) {
        t.field(TagModel.id);
        t.field(TagModel.title);
        t.field(TagModel.description);
        t.field(TagModel.activityId);
        t.field('activity', { type: Activity });
        t.list.field('goals', { type: Goal });
        t.list.field('projects', { type: Project });
    },
});

export const Reaction = objectType({
    name: ReactionModel.$name,
    definition(t) {
        t.field(ReactionModel.id);
        t.field(ReactionModel.emoji);
        t.field(ReactionModel.activityId);
        t.field('activity', { type: Activity });
        t.field(ReactionModel.goalId);
        t.field('goal', { type: Goal });
        t.field(ReactionModel.createdAt);
        t.field(ReactionModel.updatedAt);
    },
});

export const Settings = objectType({
    name: SettingsModel.$name,
    definition(t) {
        t.field(SettingsModel.id);
        t.field(SettingsModel.theme);
        t.field('activity', { type: Activity });
    },
});

export const Comment = objectType({
    name: 'Comment',
    definition(t) {
        t.field(CommentModel.id);
        t.field(CommentModel.description);
        t.field('author', { type: Activity });
        t.field('activity', { type: Activity });
        t.list.field('reactions', { type: Reaction });
        t.field(CommentModel.createdAt);
        t.field(CommentModel.updatedAt);
    },
});

export const SettingsUpdateInput = inputObjectType({
    name: 'SettingsUpdateInput',
    definition(t) {
        t.field(SettingsModel.id);
        t.field(SettingsModel.theme);
    },
});

export const GoalCreateInput = inputObjectType({
    name: 'GoalCreateInput',
    definition(t) {
        t.field(GoalModel.title);
        t.field(GoalModel.description);
        t.field(GoalModel.key);
        t.field(GoalModel.personal);
        t.field(GoalModel.private);
        t.field('estimate', { type: EstimateInput });
        t.field(GoalModel.ownerId);
        t.int('parent');
        t.string('kind'); // team, project
        t.field(GoalModel.stateId);
        t.field(GoalModel.priority);
        t.list.field('tags', { type: TagCreateInput });
        t.list.field('participants', { type: ActivityInput });
    },
});

export const GoalUpdateInput = inputObjectType({
    name: 'GoalUpdateInput',
    definition(t) {
        t.field(GoalModel.id);
        t.string('title');
        t.string('description');
        t.field(GoalModel.key);
        t.field(GoalModel.personal);
        t.field(GoalModel.private);
        t.field('estimate', { type: EstimateInput });
        t.field(GoalModel.ownerId);
        t.int('parent');
        t.string('kind'); // team, project
        t.field(GoalModel.stateId);
        t.field(GoalModel.priority);
        t.list.field('tags', { type: TagCreateInput });
        t.list.string('participants');
    },
});

export const GoalArchiveInput = inputObjectType({
    name: 'GoalArchiveInput',
    definition(t) {
        t.field(GoalModel.id);
        t.field(GoalModel.archived);
    },
});

export const EstimateInput = inputObjectType({
    name: 'EstimateInput',
    definition(t) {
        t.field(EstimateModel.y);
        t.field(EstimateModel.q);
        t.field(EstimateModel.date);
    },
});

export const ActivityInput = inputObjectType({
    name: 'ActivityInput',
    definition(t) {
        t.field(ActivityModel.id);
    },
});

export const UserUpdateInput = inputObjectType({
    name: 'UserUpdateInput',
    definition(t) {
        t.field(UserModel.id);
        t.field(UserModel.nickname);
        t.field(UserModel.name);
    },
});

export const ReactionToggleInput = inputObjectType({
    name: 'ReactionToggleInput',
    definition(t) {
        t.field(ReactionModel.emoji);
        t.field(ReactionModel.goalId);
        t.field(ReactionModel.commentId);
    },
});

export const TagCreateInput = inputObjectType({
    name: 'TagInput',
    definition(t) {
        t.field(TagModel.id);
        t.field(TagModel.title);
        t.field(TagModel.description);
    },
});

export const SubscriptionToggleInput = inputObjectType({
    name: 'SubscriptionToggleInput',
    definition(t) {
        t.string('id');
        t.boolean('direction');
    },
});

export const GoalDependencyToggleInput = inputObjectType({
    name: 'GoalDependencyToggleInput',
    definition(t) {
        t.field(GoalModel.id);
        t.string('target');
        t.field('dependency', { type: Dependency });
        t.boolean('direction');
    },
});

export const UserInvitesInput = inputObjectType({
    name: 'UserInvitesInput',
    definition(t) {
        t.list.string('emails');
    },
});

export const CommentCreateInput = inputObjectType({
    name: 'CommentCreateInput',
    definition(t) {
        t.field(CommentModel.description);
        t.field(CommentModel.goalId);
        t.field(CommentModel.activityId);
    },
});

export const CommentUpdateInput = inputObjectType({
    name: 'CommentUpdateInput',
    definition(t) {
        t.field(CommentModel.id);
        t.field(CommentModel.description);
    },
});

export const CommentDeleteInput = inputObjectType({
    name: 'CommentDeleteInput',
    definition(t) {
        t.field(CommentModel.id);
    },
});

export const ProjectCreateInput = inputObjectType({
    name: 'ProjectCreateInput',
    definition(t) {
        t.field(ProjectModel.key);
        t.field(ProjectModel.title);
        t.field(ProjectModel.description);
        t.field(ProjectModel.flowId);
    },
});

export const ProjectUpdateInput = inputObjectType({
    name: 'ProjectUpdateInput',
    definition(t) {
        t.field(ProjectModel.id);
        t.field(ProjectModel.title);
        t.field(ProjectModel.description);
        t.nonNull.list.nonNull.int('teams');
    },
});

export const ProjectDeleteInput = inputObjectType({
    name: 'ProjectDelete',
    definition(t) {
        t.field(ProjectModel.id);
    },
});

export const ProjectGoalsInput = inputObjectType({
    name: 'ProjectGoalsInput',
    definition(t) {
        t.nonNull.string('key');
        t.nonNull.list.nonNull.string('priority');
        t.nonNull.list.nonNull.string('states');
        t.nonNull.list.nonNull.string('tags');
        t.nonNull.list.nonNull.string('estimates');
        t.nonNull.list.nonNull.string('owner');
        t.nonNull.string('query');
    },
});

export const UserGoalsInput = inputObjectType({
    name: 'UserGoalsInput',
    definition(t) {
        t.nonNull.list.nonNull.string('priority');
        t.nonNull.list.nonNull.string('states');
        t.nonNull.list.nonNull.string('tags');
        t.nonNull.list.nonNull.string('estimates');
        t.nonNull.list.nonNull.string('owner');
        t.nonNull.string('query');
    },
});

export const FindActivityInput = inputObjectType({
    name: 'FindActivityInput',
    definition(t) {
        t.nonNull.string('query');
        t.list.nonNull.string('filter');
    },
});

export const TeamCreateInput = inputObjectType({
    name: 'TeamCreateInput',
    definition(t) {
        t.field(TeamModel.key);
        t.field(TeamModel.title);
        t.field(TeamModel.description);
        t.field(TeamModel.flowId);
        t.int('parent');
        t.list.nonNull.int('children');
        t.list.nonNull.string('projects');
    },
});

export const TeamUpdateInput = inputObjectType({
    name: 'TeamUpdateInput',
    definition(t) {
        t.nonNull.field(TeamModel.id);
        t.field(TeamModel.title);
        t.field(TeamModel.description);
        t.int('parent');
        t.list.nonNull.int('children');
        t.nonNull.list.nonNull.int('projects');
    },
});

export const TeamGoalsInput = inputObjectType({
    name: 'TeamGoalsInput',
    definition(t) {
        t.nonNull.field(TeamModel.key);
        t.nonNull.list.nonNull.string('priority');
        t.nonNull.list.nonNull.string('states');
        t.nonNull.list.nonNull.string('tags');
        t.nonNull.list.nonNull.string('estimates');
        t.nonNull.list.nonNull.string('owner');
        t.nonNull.string('query');
    },
});

export const TeamsInput = inputObjectType({
    name: 'TeamsInput',
    definition(t) {
        t.string('title');
    },
});

export const TeamDeleteInput = inputObjectType({
    name: 'TeamDelete',
    definition(t) {
        t.field(TeamModel.id);
    },
});

export const GoalsMetaOutput = objectType({
    name: 'GoalsMetaOutput',
    definition(t) {
        t.list.field('owners', { type: nonNull(Activity) });
        t.list.field('issuers', { type: nonNull(Activity) });
        t.list.field('participants', { type: nonNull(Activity) });
        t.list.field('tags', { type: nonNull(Tag) });
        t.list.field('states', { type: nonNull(State) });
        t.list.field('projects', { type: nonNull(Project) });
        t.list.field('teams', { type: nonNull(Team) });
        t.list.field('estimates', { type: nonNull(Estimate) });
        t.list.nonNull.string('priority');
        t.nonNull.int('count');
    },
});

export const TransferOwnershipInput = inputObjectType({
    name: 'TransferOwnershipInput',
    definition(t) {
        t.field(ProjectModel.id);
        t.nonNull.string('activityId');
    },
});
