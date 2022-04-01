import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

db.$use(async (params, next) => {
    if (params.model == 'User') {
        if (params.action == 'create') {
            const newUserEmail = params.args['data'].email;
            const connectedGhost = await db.ghost.findUnique({ where: { email: newUserEmail }, include: { activity: true } });

            params.args['data'].host_id = connectedGhost?.host_id;
            params.args['data'].activity_id = connectedGhost?.activity?.id;
            params.args['data'].invited_at = connectedGhost?.created_at;

            await db.ghost.delete({ where: { id: connectedGhost?.id }});
        }
    }

    return next(params);
});

export type Context = {
    db: PrismaClient;
};

export const context = {
    db,
};
