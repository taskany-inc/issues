import { PrismaClient } from '@prisma/client';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

export const rec = (data: unknown): any => {
    if (isObject(data)) {
        for (const property in data) {
            // eslint-disable-next-line no-prototype-builtins
            if (data.hasOwnProperty(property)) {
                if (property === 'createdAt' || property === 'updatedAt') {
                    data[property] = 'rewrite';
                }
                if (isObject(data[property])) {
                    data[property] = rec(data[property]);
                }
            }
        }
        return data;
    }
    if (isArray(data)) {
        return data.map(rec);
    }
    return data;
};

declare global {
    /* eslint-disable no-var */
    // eslint-disable-next-line vars-on-top
    var prisma: PrismaClient | undefined;
}

const prismaOriginal =
    global.prisma ||
    new PrismaClient({
        log: ['warn', 'error'],
        errorFormat: 'pretty',
    });

export const prisma = prismaOriginal.$extends({
    query: {
        $allModels: {
            $allOperations: async ({ args, query }) => {
                const data = await query(args);
                // return data;
                return rec(data);
            },
        },
    },
});

if (process.env.NODE_ENV !== 'production') global.prisma = prismaOriginal;

/* Keycloak provider sends some extra-fields
    that Prisma ORM cannot apply in migrations or
    standard OAuth Account schema names several fields another way
    Link to github issue: https://github.com/nextauthjs/next-auth/issues/3823
*/
/*
prisma.$use(async (params, next) => {
    if (params.action === 'create' && params.model === 'Account') {
        const { 'not-before-policy': _, refresh_expires_in: refreshExpiresIn, ...rest } = params.args.data;

        if (refreshExpiresIn !== undefined) {
            params.args.data = { ...rest, refresh_token_expires_in: refreshExpiresIn };
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
*/
