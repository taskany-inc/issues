/* eslint-disable no-console */
import assert from 'assert';

import { prisma } from '../src/utils/prisma';

const adminEmail = process.env.ADMIN_EMAIL || 'tony@taskany.org';
const adminPassword = process.env.ADMIN_PASSWORD || 'taskany';

const userEmail = 'user@taskany.org';
const userPassword = 'taskany';

(async () => {
    assert(adminEmail, "Admin's email isn't provided. Check your environment variables: ADMIN_EMAIL.");
    assert(adminPassword, "Admin's password isn't provided. Check your environment variables: ADMIN_PASSWORD.");

    console.log('Adding default data...');

    await Promise.all([
        prisma.priority.createMany({
            data: [
                {
                    title: 'Highest',
                    value: 4,
                },
                {
                    title: 'High',
                    value: 3,
                },
                {
                    title: 'Medium',
                    value: 2,
                },
                {
                    title: 'Low',
                    value: 1,
                },
            ].reverse(),
        }),
        prisma.flow.create({
            data: {
                title: 'Goal — Default',
                recommended: true,
                states: {
                    create: [
                        {
                            title: 'Draft',
                            hue: 1,
                            type: 'NotStarted',
                            default: true,
                        },
                        {
                            title: 'InProgress',
                            hue: 194,
                            type: 'InProgress',
                        },
                        {
                            title: 'Blocked',
                            hue: 30,
                            type: 'InProgress',
                        },
                        {
                            title: 'Finished',
                            hue: 158,
                            type: 'Completed',
                        },
                        {
                            title: 'Failed',
                            hue: 360,
                            type: 'Failed',
                        },
                        {
                            title: 'Canceled',
                            hue: 274,
                            type: 'Canceled',
                        },
                        {
                            title: 'AtRisk',
                            hue: 14,
                            type: 'InProgress',
                        },
                    ],
                },
            },
            include: {
                states: true,
            },
        }),
        prisma.filter.create({
            data: {
                mode: 'Global',
                title: 'Active',
                params: 'stateType=InProgress,NotStarted&estimate=@current',
                default: true,
            },
        }),
        prisma.user.create({
            data: {
                email: adminEmail,
                role: 'ADMIN',
                accounts: {
                    create: {
                        type: 'credentials',
                        provider: 'email',
                        providerAccountId: 'credentials',
                        password: adminPassword,
                    },
                },
                activity: {
                    create: {
                        settings: {
                            create: {},
                        },
                    },
                },
            },
        }),
        prisma.user.create({
            data: {
                email: userEmail,
                role: 'USER',
                accounts: {
                    create: {
                        type: 'credentials',
                        provider: 'email',
                        providerAccountId: 'userCredentials',
                        password: userPassword,
                    },
                },
                activity: {
                    create: {
                        settings: {
                            create: {},
                        },
                    },
                },
            },
        }),
    ]);
})();
