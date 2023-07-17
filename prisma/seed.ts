/* eslint-disable no-console */
import assert from 'assert';
import { faker } from '@faker-js/faker';
import { Role, User, Tag, Goal, StateType } from '@prisma/client';

import { prisma } from '../src/utils/prisma';
import { keyPredictor } from '../src/utils/keyPredictor';

const adminEmail = process.env.ADMIN_EMAIL || 'tony@taskany.org';
const adminPassword = process.env.ADMIN_PASSWORD || 'taskany';
const prioritiesExact = [
    {
        id: 4,
        title: 'Highest',
        value: 4,
    },
    {
        id: 3,
        title: 'High',
        value: 3,
    },
    {
        id: 2,
        title: 'Medium',
        value: 2,
    },
    {
        id: 1,
        title: 'Low',
        value: 1,
    },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sample = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

async function seed(title: string, cb: () => void) {
    console.log('SEED:', title, '...');
    await cb();
    console.log('done!');
}

assert(adminEmail, "Admin's email isn't provided. Check your environment variables: ADMIN_EMAIL.");
assert(adminPassword, "Admin's password isn't provided. Check your environment variables: ADMIN_PASSWORD.");

let allUsers: User[];
let tags: Tag[];

const init = (async () => {
    allUsers = await Promise.all(
        [
            [adminEmail, 'ADMIN', adminPassword, 'John Doe', faker.lorem.word() + faker.datatype.number()],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
            [
                faker.internet.email(),
                'USER',
                faker.internet.password(),
                faker.name.fullName(),
                faker.lorem.word() + faker.datatype.number(),
            ],
        ].map(([email, role, password, name, provider]) =>
            prisma.user.create({
                data: {
                    email,
                    role: role as Role,
                    accounts: {
                        create: {
                            type: 'credentials',
                            provider,
                            providerAccountId: 'credentials',
                            password,
                        },
                    },
                    name,
                    nickname: name,
                    image: faker.image.avatar(),
                    activity: {
                        create: {
                            settings: {
                                create: {},
                            },
                        },
                    },
                },
            }),
        ),
    );

    tags = await Promise.all([
        prisma.tag.create({
            data: {
                title: 'frontend',
                activityId: sample(allUsers).activityId,
            },
        }),
        prisma.tag.create({
            data: {
                title: 'backend',
                activityId: sample(allUsers).activityId,
            },
        }),
    ]);
})();

const flow = prisma.flow.create({
    data: {
        title: 'Goal — Default',
        recommended: true,
        states: {
            create: (
                [
                    ['Draft', 1, StateType.NotStarted],
                    ['InProgress', 194, StateType.InProgress],
                    ['Blocked', 30, StateType.InProgress],
                    ['Finished', 158, StateType.Completed],
                    ['Failed', 360, StateType.Failed],
                    ['Canceled', 274, StateType.Canceled],
                    ['AtRisk', 14, StateType.InProgress],
                ] as [string, number, StateType][]
            ).map(([title, hue, type]) => ({
                title,
                hue,
                type,
                default: title === 'Draft',
            })),
        },
    },
    include: {
        states: true,
    },
});

seed('Default projects', async () => {
    const f = await flow;
    if (!f) return;

    await init;

    await Promise.all(prioritiesExact.map((priority) => prisma.priority.create({ data: priority })));

    const allProjects = await Promise.all(
        [
            ['Frontend', sample(allUsers).activityId],
            ['QA Department', sample(allUsers).activityId],
            ['Python dev team', sample(allUsers).activityId],
            ['Backend support', sample(allUsers).activityId],
            ['Marketing', sample(allUsers).activityId],
            ['Machine Learning RnD', sample(allUsers).activityId],
            ['Lovely users communications', sample(allUsers).activityId],
            ['Finance department', sample(allUsers).activityId],
            ['Social promotion team', sample(allUsers).activityId],
            ['Cyber security', sample(allUsers).activityId],
        ].map(([title, activityId]: string[]) =>
            prisma.project.create({
                data: {
                    id: keyPredictor(title),
                    title,
                    flowId: f.id,
                    description: faker.lorem.sentence(5),
                    activityId,
                },
            }),
        ),
    );
    for (const project of allProjects) {
        if (project) {
            // eslint-disable-next-line no-await-in-loop
            const allGoals: Goal[] = await Promise.all(
                [
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers).activityId],
                    // eslint-disable-next-line no-loop-func
                ].map(([title, description, activityId]: string[], index) => {
                    const priority = sample(prioritiesExact);

                    return prisma.goal.create({
                        data: {
                            scopeId: index + 1,
                            title,
                            description,
                            projectId: project.id,
                            activityId,
                            ownerId: activityId,
                            priority: priority.title,
                            priorityId: priority.id,
                            participants: {
                                connect:
                                    Math.random() > 0.5
                                        ? [
                                              {
                                                  id: sample(allUsers)?.activityId as string,
                                              },
                                              {
                                                  id: sample(allUsers)?.activityId as string,
                                              },
                                          ]
                                        : {
                                              id: sample(allUsers)?.activityId as string,
                                          },
                            },
                            stateId: sample(f.states)?.id,
                            tags: {
                                connect:
                                    // eslint-disable-next-line no-nested-ternary
                                    Math.random() > 0.66
                                        ? tags.map((t) => ({
                                              id: t.id,
                                          }))
                                        : Math.random() > 0.33
                                        ? [sample(tags)].map((t) => ({
                                              id: t.id,
                                          }))
                                        : undefined,
                            },
                            comments: {
                                createMany: {
                                    data: [
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                        [faker.lorem.sentence(5), sample(allUsers).activityId],
                                    ].map(([description, activityId]: string[]) => ({
                                        description,
                                        activityId,
                                    })),
                                },
                            },
                        },
                        include: {
                            dependsOn: true,
                            blocks: true,
                            relatedTo: true,
                        },
                    });
                }),
            );
            for (const goal of allGoals) {
                // eslint-disable-next-line no-await-in-loop
                await prisma.goal.update({
                    where: {
                        id: goal.id,
                    },
                    data: {
                        dependsOn: {
                            connect: {
                                id: sample(allGoals.filter((item) => item.id !== goal.id))?.id,
                            },
                        },
                        blocks: {
                            connect: {
                                id: sample(allGoals.filter((item) => item.id !== goal.id))?.id,
                            },
                        },
                        relatedTo: {
                            connect: {
                                id: sample(allGoals.filter((item) => item.id !== goal.id))?.id,
                            },
                        },
                        history: {
                            createMany: {
                                data: [
                                    [faker.lorem.sentence(2), goal.title, sample(allUsers).activityId, 'title'],
                                    [
                                        faker.lorem.sentence(5),
                                        goal.description,
                                        sample(allUsers).activityId,
                                        'description',
                                    ],
                                    [sample(allUsers).activityId, null, goal.activityId, 'participants'],
                                    [null, sample(allGoals).id, sample(allUsers).activityId, 'dependencies'],
                                    [sample(allGoals).id, null, sample(allUsers).activityId, 'dependencies'],
                                ].map(([previousValue, nextValue, activityId, subject]) => {
                                    let action = 'add';

                                    if (previousValue && nextValue) {
                                        action = 'change';
                                    } else if (!nextValue) {
                                        action = 'remove';
                                    }

                                    return {
                                        subject,
                                        previousValue,
                                        nextValue,
                                        action,
                                        activityId,
                                    };
                                }),
                            },
                        },
                    },
                });
            }
        }
    }
});
