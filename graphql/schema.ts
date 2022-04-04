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
} from 'nexus';
import { DateTimeResolver } from 'graphql-scalars';
import {
    User as UserModel,
    Project as ProjectModel,
    Ghost as GhostModel,
    Activity as ActivityModel,
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

const Query = queryType({
    definition(t) {
        t.list.field('users', {
            type: User,
            args: {
                sortBy: arg({ type: 'SortOrder' }),
            },
            resolve: async (_, { sortBy }, { db }) =>
                db.user.findMany({
                    orderBy: { created_at: sortBy || undefined },
                }),
        });

        t.list.field('findUser', {
            type: User,
            args: {
                sortBy: arg({ type: 'SortOrder' }),
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
                sortBy: arg({ type: 'SortOrder' }),
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

        t.list.field('projects', {
            type: Project,
            args: {
                sortBy: arg({ type: 'SortOrder' }),
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
                user: nonNull(arg({ type: 'UserSession' })),
            },
            resolve: async (_, { user, title, description }, { db }) => {
                const validUser = await db.user.findUnique({ where: { id: user.id } });

                if (!validUser) return null;

                try {
                    const newTeam = db.project.create({
                        data: {
                            title,
                            description,
                            owner_id: validUser.id,
                        },
                    });

                    // await mailServer.sendMail({
                    //     from: '"Fred Foo 👻" <foo@example.com>',
                    //     to: 'bar@example.com, baz@example.com',
                    //     subject: 'Hello ✔',
                    //     text: `new post '${title}'`,
                    //     html: `new post <b>${title}</b>`,
                    // });

                    return newTeam;
                } catch (error) {
                    throw Error(`${error}`);
                }
            },
        });

        t.field('createGhost', {
            type: Ghost,
            args: {
                user: nonNull(arg({ type: 'UserSession' })),
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

        t.field('createTestUser', {
            type: User,
            args: {
                // user: nonNull(arg({ type: 'UserSession' })),
                email: nonNull(stringArg()),
            },
            resolve: async (_, { email }, { db }) => {
                // const validUser = await db.user.findUnique({ where: { id: user.id } });

                // if (!validUser) return null;

                try {
                    const newGhost = db.user.create({
                        data: {
                            email,
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
    types: [Query, Mutation, DateTime, SortOrder, Role, User, UserSession, Project, Ghost, Activity],
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
