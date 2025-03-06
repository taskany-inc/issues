import { Goal, PrismaClient } from '@prisma/client';

import { addCalculatedGoalsFields } from '../../src/utils/db/calculatedGoalsFields';
import { getProjectsEditableStatus } from '../../src/utils/db/getProjectEditable';

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
          Promise<string>
      >
    | TaskParams<'db:remove:project', { id: string }, Promise<null>>
    | TaskParams<'db:remove:projects', Array<{ id: string }>, Promise<null>>
    | TaskParams<'db:create:user', { email: string; name?: string; password: string; provider: string }, Promise<any>>
    | TaskParams<'db:remove:user', { id: string }, Promise<null>>
    | TaskParams<'db:create:goal', { title: string; projectId: string; ownerEmail: string }, Promise<Goal>>
    | TaskParams<'db:remove:goal', { id: string }, Promise<null>>
    | TaskParams<'db:watch:project', { projectId: string; userId: string }, Promise<null>>
    | TaskParams<'db:watch:goal', { goalId: string; userId: string }, Promise<null>>
    | TaskParams<'db:unwatch:project', { projectId: string; userId: string }, Promise<null>>
    | TaskParams<'db:unwatch:goal', { goalId: string; userId: string }, Promise<null>>
    | TaskParams<'db:participate:project', { projectId: string; userId: string }, Promise<null>>
    | TaskParams<'db:participate:goal', { goalId: string; userId: string }, Promise<null>>
    | TaskParams<'db:dropParticipate:project', { projectId: string; userId: string }, Promise<null>>
    | TaskParams<'db:dropParticipate:goal', { goalId: string; userId: string }, Promise<null>>
    | TaskParams<'db:create:tag', { title: string; userEmail: string }, Promise<any>>
    | TaskParams<'db:remove:tag', { id: string }, Promise<null>>;

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
            return project.id;
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

        'db:create:tag': async ({ title, userEmail }) => {
            const user = await prisma.user.findUniqueOrThrow({ where: { email: userEmail } });
            const tag = await prisma.tag.create({
                data: {
                    title,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    activityId: user.activityId!,
                },
            });

            return tag;
        },

        'db:remove:tag': async ({ id }) => {
            await prisma.tag.delete({ where: { id } });

            return null;
        },

        'db:remove:user': async ({ id }) => {
            await prisma.user.delete({ where: { id }, include: { activity: { include: { settings: true } } } });
            return null;
        },

        'db:create:goal': async ({ title, projectId, ownerEmail }) => {
            const [user, goals, defaultState, defaultPriority] = await Promise.all([
                prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } }),
                prisma.goal.findMany({ where: { projectId } }),
                prisma.state.findFirstOrThrow({ where: { default: true } }),
                prisma.priority.findFirstOrThrow({ where: { default: true } }),
            ]);

            if (!user.activityId) return;

            const goal = await prisma.goal.create({
                data: {
                    title,
                    description: '',
                    scopeId: goals.length + 1,
                    estimate: new Date(),
                    estimateType: 'Strict',
                    project: { connect: { id: projectId } },
                    state: { connect: { id: defaultState.id } },
                    priority: { connect: { id: defaultPriority.id } },
                    activity: { connect: { id: user.activityId } },
                    owner: { connect: { id: user.activityId } },
                },
            });

            const projectIds = [goal.projectId ?? ''];
            const editableMap = await getProjectsEditableStatus(projectIds, user.activityId, user.role);

            return {
                ...goal,
                ...addCalculatedGoalsFields(
                    goal,
                    { _isEditable: Boolean(goal.projectId && editableMap.get(goal.projectId)) },
                    user.activityId,
                    user.role,
                ),
            };
        },

        'db:remove:goal': async ({ id }) => {
            await prisma.goal.delete({ where: { id } });
            return null;
        },

        'db:watch:project': async ({ projectId, userId }) => {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    watchers: {
                        connect: { id: userId },
                    },
                },
            });

            return null;
        },

        'db:watch:goal': async ({ goalId, userId }) => {
            await prisma.goal.update({
                where: { id: goalId },
                data: {
                    watchers: {
                        connect: { id: userId },
                    },
                },
            });
            return null;
        },

        'db:unwatch:project': async ({ projectId, userId }) => {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    watchers: {
                        disconnect: { id: userId },
                    },
                },
            });

            return null;
        },

        'db:unwatch:goal': async ({ goalId, userId }) => {
            await prisma.goal.update({
                where: { id: goalId },
                data: {
                    watchers: {
                        disconnect: { id: userId },
                    },
                },
            });
            return null;
        },

        'db:participate:project': async ({ projectId, userId }) => {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    participants: {
                        connect: { id: userId },
                    },
                },
            });

            return null;
        },

        'db:participate:goal': async ({ goalId, userId }) => {
            await prisma.goal.update({
                where: { id: goalId },
                data: {
                    participants: {
                        connect: { id: userId },
                    },
                },
            });
            return null;
        },

        'db:dropParticipate:project': async ({ projectId, userId }) => {
            await prisma.project.update({
                where: { id: projectId },
                data: {
                    participants: {
                        disconnect: { id: userId },
                    },
                },
            });

            return null;
        },

        'db:dropParticipate:goal': async ({ goalId, userId }) => {
            await prisma.goal.update({
                where: { id: goalId },
                data: {
                    participants: {
                        disconnect: { id: userId },
                    },
                },
            });
            return null;
        },
    });
};
