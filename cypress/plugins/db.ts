import { PrismaClient } from '@prisma/client';

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

        'db:remove:goal': async ({ id }) => {
            await prisma.goal.deleteMany({ where: { id } });
            return null;
        },
    });
};
