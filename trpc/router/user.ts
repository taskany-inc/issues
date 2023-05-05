import { z } from 'zod';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { suggestionsUserSchema, updateUserSchema } from '../../src/schema/user';

export const userRouter = router({
    suggestions: protectedProcedure.input(suggestionsUserSchema).query(async ({ input: { query, filter } }) => {
        return prisma.activity.findMany({
            take: 5,
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
                ],
                ...(filter
                    ? {
                          id: {
                              notIn: filter,
                          },
                      }
                    : {}),
            },
            include: {
                user: true,
                ghost: true,
            },
        });
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
});
