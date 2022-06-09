/* eslint-disable @typescript-eslint/no-use-before-define */
import { asNexusMethod, objectType, inputObjectType, enumType } from 'nexus';
import { DateTimeResolver } from 'graphql-scalars';
import {
    User as UserModel,
    Project as ProjectModel,
    Ghost as GhostModel,
    Activity as ActivityModel,
    Goal as GoalModel,
    Estimate as EstimateModel,
    Flow as FlowModel,
    State as StateModel,
    Tag as TagModel,
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

const UserKind = enumType({
    name: 'UserKind',
    members: ['USER', 'GHOST'],
});

export const UserSession = inputObjectType({
    name: 'UserSession',
    definition(t) {
        t.field(UserModel.id);
        t.field(UserModel.email);
        t.field(UserModel.name);
        t.field(UserModel.image);
        t.field(UserModel.role);
    },
});

export const User = objectType({
    name: UserModel.$name,
    definition(t) {
        t.field(UserModel.id);
        t.field(UserModel.email);
        t.field(UserModel.name);
        t.field(UserModel.image);
        t.field('activity', { type: Activity });
        t.field(UserModel.activityId);
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

export const UserAnyKind = objectType({
    name: 'UserAnyKind',
    definition(t) {
        t.string('id');
        t.string('email');
        t.string('name');
        t.string('image');
        t.field('activity', { type: Activity });
        t.field('kind', { type: UserKind });
    },
});

export const Project = objectType({
    name: ProjectModel.$name,
    definition(t) {
        t.field(ProjectModel.id);
        t.field(ProjectModel.key);
        t.field(ProjectModel.title);
        t.field(ProjectModel.description);
        t.field('owner', { type: Activity });
        t.field('computedOwner', { type: UserAnyKind });
        t.list.field('goals', { type: Goal });
        t.field('flow', { type: Flow });
        t.list.field('tags', { type: Tag });
        t.field(ProjectModel.createdAt);
        t.field(ProjectModel.updatedAt);
    },
});

export const Goal = objectType({
    name: GoalModel.$name,
    definition(t) {
        t.field(GoalModel.id);
        t.field(GoalModel.title);
        t.field(GoalModel.description);
        t.field(GoalModel.key);
        t.field(GoalModel.personal);
        t.field(GoalModel.private);
        t.list.field('estimate', { type: Estimate });
        t.field(GoalModel.createdAt);
        t.field(GoalModel.updatedAt);
        t.field('issuer', { type: Activity });
        t.field(GoalModel.issuerId);
        t.field('owner', { type: Activity });
        t.field(GoalModel.ownerId);
        t.list.field('participants', { type: Activity });
        t.field(GoalModel.projectId);
        t.field('project', { type: Project });
        t.field(GoalModel.stateId);
        t.field('state', { type: State });
        t.list.field('tags', { type: Tag });
        t.list.field('dependsOn', { type: Goal });
        t.list.field('blocks', { type: Goal });
        t.list.field('relatedTo', { type: Goal });
        t.list.field('connected', { type: Goal });
        t.field('computedOwner', { type: UserAnyKind });
        t.field('computedIssuer', { type: UserAnyKind });
    },
});

export const Estimate = objectType({
    name: EstimateModel.$name,
    definition(t) {
        t.field(EstimateModel.id);
        t.field(EstimateModel.y);
        t.field(EstimateModel.q);
        t.field(EstimateModel.date);
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

export const GoalInput = inputObjectType({
    name: 'GoalInput',
    definition(t) {
        t.field(GoalModel.id);
        t.string('title');
        t.string('description');
        t.field(GoalModel.key);
        t.field(GoalModel.personal);
        t.field(GoalModel.private);
        t.field('estimate', { type: EstimateInput });
        t.field(GoalModel.ownerId);
        t.field(GoalModel.projectId);
        t.field(GoalModel.stateId);
        t.list.field('watchers', { type: ActivityInput });
        t.list.field('stars', { type: ActivityInput });
        // t.list.field('participants', { type: Activity });
        // t.list.field('tags', { type: Tag });
        // t.list.field('dependsOn', { type: Goal });
        // t.list.field('blocks', { type: Goal });
        // t.list.field('relatedTo', { type: Goal });
        // t.list.field('connected', { type: Goal });
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

export const computeUserFields = {
    include: {
        user: true,
        ghost: true,
    },
};

export const withComputedField =
    (...args: string[]) =>
    <T>(o: T): T => ({
        ...o,
        ...args.reduce((acc, field) => {
            // @ts-ignore
            acc[`computed${field[0].toUpperCase() + field.substring(1)}`] = o[`${field}`]?.user ?? o[`${field}`]?.ghost;

            return acc;
        }, {}),
    });
