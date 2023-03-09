import { PrismaClient } from '@prisma/client';

declare global {
    /* eslint-disable no-var */
    // eslint-disable-next-line vars-on-top
    var prisma: PrismaClient | undefined;
}

export const prisma =
    global.prisma ||
    new PrismaClient({
        log: ['warn', 'error'],
        errorFormat: 'pretty',
    });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

/* Keycloak provider sends some extra-fields
    that Prisma ORM cannot apply in migrations or
    standard OAuth Account schema names several fields another way
    Link to github issue: https://github.com/nextauthjs/next-auth/issues/3823
*/
prisma.$use(async (params, next) => {
    if (params.action === 'create' && params.model === 'Account') {
        const { refresh_expires_in: refreshExpiresIn, ...rest } = params.args.data;

        if (refreshExpiresIn !== undefined) {
            params.args.data = { ...rest, refresh_token_expires_in: refreshExpiresIn };
            delete params.args.data['not-before-policy'];
        }
    }

    return next(params);
});

prisma.$use(async (params, next) => {
    if (params.model === 'User') {
        if (params.action === 'create') {
            const newUserEmail = params.args.data.email;
            const connectedGhost = await prisma.ghost.findUnique({
                where: { email: newUserEmail },
                include: { activity: true },
            });

            if (!connectedGhost) return next(params);

            params.args.data.hostId = connectedGhost?.hostId;
            params.args.data.activityId = connectedGhost?.activity?.id;
            params.args.data.invitedAt = connectedGhost?.createdAt;

            await prisma.ghost.delete({ where: { id: connectedGhost?.id } });
        }
    }

    return next(params);
});
