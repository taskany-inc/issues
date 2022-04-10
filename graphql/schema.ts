import { join } from 'path';
import {
    makeSchema,
    queryType,
    mutationType,
    asNexusMethod,
    objectType,
    inputObjectType,
    enumType,
    arg,
    nonNull,
    stringArg,
    booleanArg,
    intArg,
} from 'nexus';
import { DateTimeResolver } from 'graphql-scalars';
import {
    User as UserModel,
    Project as ProjectModel,
    Ghost as GhostModel,
    Activity as ActivityModel,
    Goal as GoalModel,
} from 'nexus-prisma';

import { mailServer } from '../src/utils/mailServer';

const DateTime = asNexusMethod(DateTimeResolver, 'DateTime');
const SortOrder = enumType({
    name: 'SortOrder',
    members: ['asc', 'desc'],
});
const Role = enumType({
    name: 'Role',
    members: ['USER', 'ADMIN'],
});
const UserKind = enumType({
    name: 'UserKind',
    members: ['USER', 'GHOST'],
});
const Quarter = enumType({
    name: 'Quarter',
    members: ['Q1', 'Q2', 'Q3', 'Q4'],
});

const UserSession = inputObjectType({
    name: 'UserSession',
    definition(t) {
        t.field(UserModel.id);
        t.field(UserModel.email);
        t.field(UserModel.name);
        t.field(UserModel.image);
        t.field(UserModel.role);
    },
});

const User = objectType({
    name: UserModel.$name,
    definition(t) {
        t.field(UserModel.id);
        t.field(UserModel.email);
        t.field(UserModel.name);
        t.field(UserModel.image);
        t.field('activity', { type: Activity });
        t.field(UserModel.activity_id);
        t.field(UserModel.role);
        t.field(UserModel.created_at);
        t.field(UserModel.updated_at);
    },
});

const Activity = objectType({
    name: ActivityModel.$name,
    definition(t) {
        t.field(ActivityModel.id);
        t.field(ActivityModel.created_at);
        t.field(ActivityModel.updated_at);
    },
});

const Ghost = objectType({
    name: GhostModel.$name,
    definition(t) {
        t.field(GhostModel.id);
        t.field(GhostModel.email);
        t.field('host', { type: User });
        t.field(GhostModel.host_id);
        t.field('user', { type: User });
        t.field(GhostModel.created_at);
        t.field(GhostModel.updated_at);
        t.field('activity', { type: Activity });
    },
});

const UserAnyKind = objectType({
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

const Project = objectType({
    name: ProjectModel.$name,
    definition(t) {
        t.field(ProjectModel.id);
        t.field(ProjectModel.title);
        t.field(ProjectModel.description);
        t.field('owner', { type: Activity });
        t.field(ProjectModel.owner_id);
        t.field(ProjectModel.created_at);
        t.field(ProjectModel.updated_at);
    },
});

const Goal = objectType({
    name: GoalModel.$name,
    definition(t) {
        t.field(GoalModel.id);
        t.field(GoalModel.title);
        t.field(GoalModel.description);
        t.field(GoalModel.key);
        t.field(GoalModel.personal);
        t.field(GoalModel.private);
        t.field(GoalModel.estimate);
        t.field(GoalModel.year);
        t.list.field('quarter', { type: Quarter });
        t.field(GoalModel.created_at);
        t.field(GoalModel.updated_at);
        t.field('issuer', { type: Activity });
        t.field(GoalModel.issuer_id);
        t.field('owner', { type: Activity });
        t.field(GoalModel.owner_id);
        t.list.field('participants', { type: Activity });
        t.list.field('project', { type: Project });
        t.field(GoalModel.project_id);
        t.list.field('dependsOn', { type: Goal });
        t.list.field('blocks', { type: Goal });
        t.list.field('relatedTo', { type: Goal });
        t.list.field('connected', { type: Goal });
    },
});

const Query = queryType({
    definition(t) {
        t.list.field('users', {
            type: User,
            args: {
                sortBy: arg({ type: SortOrder }),
            },
            resolve: async (_, { sortBy }, { db }) =>
                db.user.findMany({
                    orderBy: { created_at: sortBy || undefined },
                }),
        });

        t.list.field('findUser', {
            type: User,
            args: {
                sortBy: arg({ type: SortOrder }),
                query: nonNull(stringArg()),
            },
            resolve: async (_, { query, sortBy }, { db }) => {
                return db.user.findMany({
                    where: {
                        OR: [
                            {
                                email: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                name: {
                                    contains: query,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                });
            },
        });

        t.list.field('findGhost', {
            type: Ghost,
            args: {
                sortBy: arg({ type: SortOrder }),
                query: nonNull(stringArg()),
            },
            resolve: async (_, { query, sortBy }, { db }) => {
                return db.ghost.findMany({
                    where: {
                        email: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                });
            },
        });

        t.list.field('findUserAnyKind', {
            type: UserAnyKind,
            args: {
                sortBy: arg({ type: SortOrder }),
                query: nonNull(stringArg()),
            },
            resolve: async (_, { query, sortBy }, { db }) => {
                if (query === '') {
                    return [];
                }

                const [ghosts, users] = await Promise.all([
                    db.ghost.findMany({
                        where: {
                            email: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        include: {
                            activity: true,
                        },
                        take: 5,
                    }),
                    db.user.findMany({
                        where: {
                            OR: [
                                {
                                    email: {
                                        contains: query,
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    name: {
                                        contains: query,
                                        mode: 'insensitive',
                                    },
                                },
                            ],
                        },
                        include: {
                            activity: true,
                        },
                        take: 5,
                    }),
                ]);

                return [
                    ...users.map((u) => {
                        // @ts-ignore
                        u.kind = 'USER';
                        return u;
                    }),
                    ...ghosts.map((g) => {
                        // @ts-ignore
                        g.kind = 'GHOST';
                        return g;
                    }),
                ];
            },
        });

        t.list.field('projects', {
            type: Project,
            args: {
                sortBy: arg({ type: SortOrder }),
            },
            resolve: async (_, { sortBy }, { db }) =>
                db.project.findMany({
                    orderBy: { created_at: sortBy || undefined },
                    include: {
                        owner: true,
                    },
                }),
        });
    },
});

const Mutation = mutationType({
    definition(t) {
        t.field('createProject', {
            type: Project,
            args: {
                title: nonNull(stringArg()),
                description: stringArg(),
                owner_id: nonNull(stringArg()),
                user: nonNull(arg({ type: UserSession })),
            },
            resolve: async (_, { user, title, description, owner_id }, { db }) => {
                const validUser = await db.user.findUnique({ where: { id: user.id }, include: { activity: true } });
                const projectOwner = await db.user.findUnique({ where: { id: owner_id }, include: { activity: true } });

                if (!validUser) return null;

                const resolvedOwnerId = projectOwner?.activity?.id || validUser.activity?.id;

                try {
                    const newProject = db.project.create({
                        data: {
                            title,
                            description,
                            owner_id: resolvedOwnerId,
                        },
                    });

                    // await mailServer.sendMail({
                    //     from: '"Fred Foo 👻" <foo@example.com>',
                    //     to: 'bar@example.com, baz@example.com',
                    //     subject: 'Hello ✔',
                    //     text: `new post '${title}'`,
                    //     html: `new post <b>${title}</b>`,
                    // });

                    return newProject;
                } catch (error) {
                    throw Error(`${error}`);
                }
            },
        });

        t.field('createGoal', {
            type: Goal,
            args: {
                title: nonNull(stringArg()),
                description: nonNull(stringArg()),
                project_id: nonNull(intArg()),
                key: booleanArg(),
                private: booleanArg(),
                personal: booleanArg(),
                owner_id: nonNull(stringArg()),
                user: nonNull(arg({ type: UserSession })),
            },
            resolve: async (_, { user, title, description, owner_id, project_id, key, private: isPrivate, personal }, { db }) => {
                const validUser = await db.user.findUnique({ where: { id: user.id }, include: { activity: true } });
                const goalOwner = await db.user.findUnique({ where: { id: owner_id }, include: { activity: true } });

                if (!validUser) return null;

                try {
                    const newGoal = db.goal.create({
                        data: {
                            title,
                            description,
                            project_id,
                            key: Boolean(key),
                            private: Boolean(isPrivate),
                            personal: Boolean(personal),
                            owner_id: goalOwner?.activity?.id,
                            issuer_id: validUser.activity?.id,
                        },
                    });

                    // await mailServer.sendMail({
                    //     from: '"Fred Foo 👻" <foo@example.com>',
                    //     to: 'bar@example.com, baz@example.com',
                    //     subject: 'Hello ✔',
                    //     text: `new post '${title}'`,
                    //     html: `new post <b>${title}</b>`,
                    // });

                    return newGoal;
                } catch (error) {
                    throw Error(`${error}`);
                }
            },
        });

        t.field('inviteUser', {
            type: Ghost,
            args: {
                user: nonNull(arg({ type: UserSession })),
                email: nonNull(stringArg()),
            },
            resolve: async (_, { user, email }, { db }) => {
                const validUser = await db.user.findUnique({ where: { id: user.id } });

                if (!validUser) return null;

                try {
                    const newGhost = db.ghost.create({
                        data: {
                            email,
                            host_id: validUser.id,
                            activity: {
                                create: {},
                            },
                        },
                    });

                    // await mailServer.sendMail({
                    //     from: '"Fred Foo 👻" <foo@example.com>',
                    //     to: 'bar@example.com, baz@example.com',
                    //     subject: 'Hello ✔',
                    //     text: `new post '${title}'`,
                    //     html: `new post <b>${title}</b>`,
                    // });

                    return newGhost;
                } catch (error) {
                    throw Error(`${error}`);
                }
            },
        });
    },
});

export const schema = makeSchema({
    types: [
        Query,
        Mutation,
        DateTime,
        SortOrder,
        Role,
        User,
        UserSession,
        Project,
        Ghost,
        Activity,
        UserAnyKind,
        UserKind,
        Goal,
        Quarter,
    ],
    outputs: {
        schema: join(process.cwd(), 'graphql/schema.graphql'),
        typegen: join(process.cwd(), 'graphql/generated/nexus.d.ts'),
    },
    contextType: {
        module: join(process.cwd(), 'graphql/context.ts'),
        export: 'Context',
    },
    sourceTypes: {
        modules: [
            {
                module: '@prisma/client',
                alias: 'db',
            },
        ],
    },
    plugins: [],
});
