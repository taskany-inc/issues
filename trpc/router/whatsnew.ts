import { z } from 'zod';
import path from 'path';
import fs from 'fs';

import { prisma } from '../../src/utils/prisma';
import { protectedProcedure, router } from '../trpcBackend';
import { routes } from '../../src/hooks/router';
import { languages } from '../../src/utils/getLang';
import { releaseSchema } from '../../src/schema/release';

export const whatsnew = router({
    check: protectedProcedure
        .input(
            z.object({
                locale: z.enum(languages),
            }),
        )
        .query(async ({ ctx, input: { locale } }) => {
            let delayed = false;
            let read = false;
            let createdAt: Date | undefined;
            let version: string | undefined;

            const whatsnewDir = path.join(process.cwd(), 'src/pages/whatsnew');
            try {
                const directories = await fs.promises.readdir(whatsnewDir);
                const versionsWithNotes = directories.filter((f) => /^\d+\.\d+\.\d+$/.test(f));
                version = versionsWithNotes.at(-1);
            } catch (e) {
                console.log(e);
            }

            const releaseNotesExists = version
                ? (await fetch(`${process.env.PUBLIC_URL}${routes.whatsnew(version, locale)}`)).status === 200
                : undefined;

            if (version && releaseNotesExists) {
                let release = await prisma.release.findFirst({
                    where: { version },
                    include: {
                        readers: { where: { id: ctx.session.user.activityId } },
                        delayers: { where: { id: ctx.session.user.activityId } },
                    },
                });

                if (release) {
                    read = Boolean(release.readers.length);
                    delayed = Boolean(release.delayers.length);
                } else {
                    release = await prisma.release.create({
                        data: {
                            version,
                        },
                        include: { readers: true, delayers: true },
                    });
                }

                createdAt = release.createdAt;
            }

            return {
                version,
                releaseNotesExists,
                read,
                delayed,
                createdAt,
            };
        }),
    markAsRead: protectedProcedure.input(releaseSchema).mutation(async ({ ctx, input: { version } }) => {
        return prisma.release.update({
            where: {
                version,
            },
            data: {
                readers: {
                    connect: [{ id: ctx.session.user.activityId }],
                },
            },
        });
    }),
    markAsDelayed: protectedProcedure.input(releaseSchema).mutation(async ({ ctx, input: { version } }) => {
        return prisma.release.update({
            where: {
                version,
            },
            data: {
                delayers: {
                    connect: [{ id: ctx.session.user.activityId }],
                },
            },
        });
    }),
});
