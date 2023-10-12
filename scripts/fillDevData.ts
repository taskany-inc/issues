/* eslint-disable no-console */
import { faker } from '@faker-js/faker';

import { prisma } from '../src/utils/prisma';
import { keyPredictor } from '../src/utils/keyPredictor';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sample = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

(async () => {
    console.log('Adding fake data...');

    const [flow, priority] = await Promise.all([
        prisma.flow.findFirst({
            where: {
                recommended: true,
            },
            include: {
                states: true,
            },
        }),
        prisma.priority.findMany(),
    ]);

    if (!flow) {
        throw new Error('You must run seed script before');
    }

    const users = await Promise.all(
        [
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
            [
                faker.internet.email(),
                faker.internet.password(),
                faker.person.fullName(),
                faker.lorem.word() + faker.number.int(),
            ],
        ].map(([email, password, name, provider]) =>
            prisma.user.create({
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

    const tags = await Promise.all([
        prisma.tag.create({
            data: {
                title: 'frontend',
                activityId: sample(users).activityId,
            },
        }),
        prisma.tag.create({
            data: {
                title: 'backend',
                activityId: sample(users).activityId,
            },
        }),
    ]);

    const allProjects = await Promise.all(
        [
            ['Frontend', sample(users).activityId],
            ['QA Department', sample(users).activityId],
            ['Python dev team', sample(users).activityId],
            ['Backend support', sample(users).activityId],
            ['Marketing', sample(users).activityId],
            ['Machine Learning RnD', sample(users).activityId],
            ['Lovely users communications', sample(users).activityId],
            ['Finance department', sample(users).activityId],
            ['Social promotion team', sample(users).activityId],
            ['Cyber security', sample(users).activityId],
        ].map(([title, activityId]: string[]) =>
            prisma.project.create({
                data: {
                    id: keyPredictor(title),
                    title,
                    flowId: flow.id,
                    description: faker.lorem.sentence(5),
                    activityId,
                },
            }),
        ),
    );

    for (const project of allProjects) {
        if (project) {
            // eslint-disable-next-line no-await-in-loop
            const allGoals = await Promise.all(
                [
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(users).activityId],
                    // eslint-disable-next-line no-loop-func
                ].map(([title, description, activityId]: string[], index) => {
                    return prisma.goal.create({
                        data: {
                            scopeId: index + 1,
                            title,
                            description,
                            projectId: project.id,
                            activityId,
                            ownerId: activityId,
                            priorityId: sample(priority).id,
                            participants: {
                                connect:
                                    Math.random() > 0.5
                                        ? [
                                              {
                                                  id: sample(users)?.activityId as string,
                                              },
                                              {
                                                  id: sample(users)?.activityId as string,
                                              },
                                          ]
                                        : {
                                              id: sample(users)?.activityId as string,
                                          },
                            },
                            stateId: sample(flow.states)?.id,
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
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
                                        [faker.lorem.sentence(5), sample(users).activityId],
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
                                    [faker.lorem.sentence(2), goal.title, sample(users).activityId, 'title'],
                                    [
                                        faker.lorem.sentence(5),
                                        goal.description,
                                        sample(users).activityId,
                                        'description',
                                    ],
                                    [sample(users).activityId, null, goal.activityId, 'participants'],
                                    [null, sample(allGoals).id, sample(users).activityId, 'dependencies'],
                                    [sample(allGoals).id, null, sample(users).activityId, 'dependencies'],
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

    console.log('done!');
})();
