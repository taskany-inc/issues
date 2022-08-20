import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { User, SortOrder, UserAnyKind, Ghost, UserInput, UserInvitesInput } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.list.field('users', {
        type: User,
        args: {
            sortBy: arg({ type: SortOrder }),
        },
        resolve: async (_, { sortBy }, { db }) =>
            db.user.findMany({
                orderBy: { createdAt: sortBy || undefined },
            }),
    });

    t.list.field('findUserAnyKind', {
        type: UserAnyKind,
        args: {
            query: nonNull(stringArg()),
        },
        // eslint-disable-next-line no-shadow
        resolve: async (_, { query }, { db }) => {
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
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.list.field('usersInvites', {
        type: Ghost,
        args: {
            input: nonNull(arg({ type: UserInvitesInput })),
        },
        resolve: async (_, { input }, { db, user }) => {
            if (!user) return null;
            if (!input.emails?.length) return null;

            const emails = input.emails.filter(Boolean) as string[];

            try {
                const newGhosts = Promise.all(
                    emails.map((email) =>
                        db.ghost.create({
                            data: {
                                email,
                                hostId: user.id,
                                activity: {
                                    create: {
                                        settings: {
                                            create: {},
                                        },
                                    },
                                },
                            },
                        }),
                    ),
                );

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post <b>${title}</b>`,
                // });

                return newGhosts;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });

    t.field('updateUser', {
        type: User,
        args: {
            data: nonNull(arg({ type: UserInput })),
        },
        resolve: async (_, { data: { id, ...data } }, { db }) => {
            try {
                return db.user.update({
                    where: { id },
                    data,
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post <b>${title}</b>`,
                // });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
