import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { settingsUserSchema, suggestionsUserSchema, updateUserSchema } from '../../src/schema/user';

export const user = router({
    suggestions: protectedProcedure
        .input(suggestionsUserSchema)
        .query(async ({ input: { query, filter, include, take = 5 } }) => {
            return Promise.all([
                prisma.activity.findMany({
                    take,
                    where: {
                        OR: [
                            {
                                ghost: {
                                    email: {
                                        contains: query,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                            {
                                user: {
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
                            },
                            {
                                id: {
                                    in: include,
                                },
                            },
                        ],
                        ...(filter || include
                            ? {
                                  id: {
                                      notIn: [...(filter || []), ...(include || [])],
                                  },
                              }
                            : {}),
                    },
                    include: {
                        user: true,
                        ghost: true,
                    },
                }),
                include
                    ? prisma.activity.findMany({
                          where: {
                              id: {
                                  in: include,
                              },
                          },
                          include: {
                              user: true,
                              ghost: true,
                          },
                      })
                    : Promise.resolve([]),
            ]).then(([suggest, included]) => [...included, ...suggest]);
        }),
    invite: protectedProcedure.input(z.array(z.string())).mutation(({ ctx, input }) => {
        try {
            const newGhosts = Promise.all(
                input.map((email) =>
                    prisma.ghost.create({
                        data: {
                            email,
                            hostId: ctx.session.user.activityId,
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
    }),
    update: protectedProcedure.input(updateUserSchema).mutation(({ ctx, input }) => {
        return prisma.user.update({ where: { id: ctx.session.user.id }, data: input });
    }),
    settings: protectedProcedure.query(async ({ ctx }) => {
        const activityWithSettings = await prisma.activity.findUnique({
            where: {
                id: ctx.session.user.activityId,
            },
            include: {
                settings: true,
            },
        });

        if (!activityWithSettings) return null;

        return activityWithSettings.settings;
    }),
    updateSettings: protectedProcedure.input(settingsUserSchema).mutation(async ({ ctx, input }) => {
        const activity = await prisma.activity.findUnique({
            where: {
                id: ctx.session.user.activityId,
            },
            include: {
                settings: true,
            },
        });

        return prisma.settings.update({ where: { id: activity?.settingsId }, data: input });
    }),
});
