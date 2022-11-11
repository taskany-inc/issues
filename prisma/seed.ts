/* eslint-disable no-console */
import assert from 'assert';
import { faker } from '@faker-js/faker';
import { Role, User } from '@prisma/client';

import { prisma } from '../src/utils/prisma';
import { keyPredictor } from '../src/utils/keyPredictor';

const adminEmail = process.env.ADMIN_EMAIL || 'tony@taskany.org';
const adminPassword = process.env.ADMIN_PASSWORD || 'taskany';
const tags = ['frontend', 'backend'];
const priorities = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
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

(async () => {
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
})();

const flow = prisma.flow.create({
    data: {
        title: 'Goal — Default',
        recommended: true,
        states: {
            create: [
                ['Draft', 1],
                ['InProgress', 194],
                ['Blocked', 30],
                ['Finished', 158],
                ['Failed', 360],
                ['Canceled', 274],
                ['AtRisk', 14],
            ].map(([title, hue]) => ({
                title: title as string,
                hue: hue as number,
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

    const allProjects = await Promise.all(
        [
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
            [`${faker.animal.cat()}-${faker.datatype.number()}`, sample(allUsers)?.activityId],
        ].map(([title, userId]) =>
            prisma.project.create({
                data: {
                    title: title as string,
                    key: keyPredictor(title as string),
                    flowId: f.id,
                    description: faker.lorem.sentence(5),
                    activityId: userId as string,
                },
            }),
        ),
    );
    for (const project of allProjects) {
        if (project) {
            // eslint-disable-next-line no-await-in-loop
            const allGoals = await Promise.all(
                [
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    [faker.lorem.words(2), faker.lorem.sentence(5), sample(allUsers)?.activityId],
                    // eslint-disable-next-line no-loop-func
                ].map(([title, description, userId], index) =>
                    prisma.goal.create({
                        data: {
                            id: `${project.key}-${index}`,
                            title: title as string,
                            description: description as string,
                            projectId: project.id,
                            activityId: userId,
                            ownerId: userId,
                            priority: sample(priorities),
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
                                create:
                                    // eslint-disable-next-line no-nested-ternary
                                    Math.random() > 0.66
                                        ? [
                                              {
                                                  title: sample(tags) as string,
                                                  activityId: userId as string,
                                              },
                                              {
                                                  title: sample(tags) as string,
                                                  activityId: userId as string,
                                              },
                                          ]
                                        : Math.random() > 0.33
                                        ? {
                                              title: sample(tags) as string,
                                              activityId: userId as string,
                                          }
                                        : undefined,
                            },
                            comments: {
                                createMany: {
                                    data: [
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                        [faker.lorem.sentence(5), sample(allUsers)?.activityId],
                                    ].map(([description, userId]) => ({
                                        description: description as string,
                                        activityId: userId as string,
                                    })),
                                },
                            },
                        },
                        include: {
                            dependsOn: true,
                            blocks: true,
                            relatedTo: true,
                        },
                    }),
                ),
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
                    },
                });
            }
        }
    }
});
