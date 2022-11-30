import { Prisma, PrismaClient } from '@prisma/client';

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
prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    if (params.action === 'create' && params.model === 'Account') {
        const { 'not-before-policy': value, refresh_expires_in: refreshExpiresIn, ...rest } = params.args.data;

        if (refreshExpiresIn !== undefined) {
            params.args.data = { ...rest, refresh_token_expires_in: refreshExpiresIn };
        }
    }

    return next(params);
});
