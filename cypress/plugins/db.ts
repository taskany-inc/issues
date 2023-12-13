import { PrismaClient } from '@prisma/client';

import { addCalculatedGoalsFields } from '../../trpc/queries/goals';

type TaskParams<K extends string, D, R> = {
    [key in K]: D extends void ? (data?: D) => R : (data: D) => R;
};

const prisma = new PrismaClient({
    log: ['warn', 'error'],
    errorFormat: 'pretty',
});

export type DbTasks =
    | TaskParams<
          'db:create:project',
          {
              title: string;
              key: string;
              description?: string;
              ownerEmail: string;
          },
          Promise<any>
      >
    | TaskParams<'db:remove:project', { id: string }, Promise<null>>
    | TaskParams<'db:create:user', { email: string; name?: string; password: string; provider: string }, Promise<any>>
    | TaskParams<'db:remove:user', { id: string }, Promise<null>>
    | TaskParams<'db:create:goal', { title: string; projectId: string; ownerEmail: string }, Promise<any>>
    | TaskParams<'db:remove:goal', { id: string }, Promise<null>>;

interface DbPluginEvents extends Cypress.PluginEvents {
    (action: 'task', tasks: DbTasks): void;
}

export const initDb = (on: DbPluginEvents) => {
    on('task', {
        'db:create:project': async ({ title, description, key, ownerEmail }) => {
            const [flow, user] = await Promise.all([
                prisma.flow.findFirstOrThrow({
                    where: { recommended: true },
                    include: { states: true },
                }),
                prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } }),
            ]);
            const project = await prisma.project.create({
                data: {
                    title,
                    description,
                    id: key,
                    flowId: flow.id,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    activityId: user.activityId!,
                },
            });
            return project;
        },

        'db:remove:project': async ({ id }) => {
            await prisma.project.delete({ where: { id } });
            return null;
        },

        'db:create:user': async ({ name, email, password, provider }) => {
            const user = await prisma.user.create({
                data: {
                    email,
                    role: 'USER',
                    accounts: {
                        create: {
                            type: 'credentials',
                            provider,
                            providerAccountId: 'credentials',
                            password,
                        },
                    },
                    name,
                    activity: {
                        create: {
                            settings: {
                                create: {},
                            },
                        },
                    },
                },
            });

            return user;
        },

        'db:remove:user': async ({ id }) => {
            await prisma.user.delete({ where: { id } });
            return null;
        },

        'db:create:goal': async ({ title, projectId, ownerEmail }) => {
            const [user, goals] = await Promise.all([
                prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } }),
                prisma.goal.findMany({ where: { projectId } }),
            ]);

            if (!user.activityId) return;

            const goal = await prisma.goal.create({
                data: {
                    title,
                    description: '',
                    projectId,
                    activityId: user.activityId,
                    ownerId: user.activityId,
                    scopeId: goals.length + 1,
                },
            });

            return {
                ...goal,
                ...addCalculatedGoalsFields(goal, user.activityId, user.role),
            };
        },

        'db:remove:goal': async ({ id }) => {
            await prisma.goal.delete({ where: { id } });
            return null;
        },
    });
};
