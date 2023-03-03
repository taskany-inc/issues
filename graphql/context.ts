import { PrismaClient, User, Activity } from '@prisma/client';
import { NextApiRequest } from 'next';

export type Context = {
    db: PrismaClient;
    req: NextApiRequest;
    user: User | null;
    activity: Activity | null;
};
