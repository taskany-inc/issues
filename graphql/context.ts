import { PrismaClient, User, Activity } from '@prisma/client';
import { NextApiRequest } from 'next';

const db = new PrismaClient();

db.$use(async (params, next) => {
    if (params.model === 'User') {
        if (params.action === 'create') {
            const newUserEmail = params.args.data.email;
            const connectedGhost = await db.ghost.findUnique({
                where: { email: newUserEmail },
                include: { activity: true },
            });

            params.args.data.hostId = connectedGhost?.hostId;
            params.args.data.activityId = connectedGhost?.activity?.id;
            params.args.data.invitedAt = connectedGhost?.createdAt;

            await db.ghost.delete({ where: { id: connectedGhost?.id } });
        }
    }

    return next(params);
});

export type Context = {
    db: PrismaClient;
    req: NextApiRequest;
    user: User | null;
    activity: Activity | null;
};

export const context = {
    db,
};
