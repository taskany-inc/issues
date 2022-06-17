/* eslint-disable no-console */
import assert from 'assert';

import { prisma } from '../src/utils/prisma';

const adminEmail = process.env.ADMIN_EMAIL || 'tony@taskany.org';
const adminPassword = process.env.ADMIN_PASSWORD || 'taskany';

async function seed(title: string, cb: () => void) {
    console.log('SEED:', title, '...');
    await cb();
    console.log('done!');
}

seed('Admin user', async () => {
    assert(adminEmail, "Admin's email isn't provided. Check your environment variables: ADMIN_EMAIL.");
    assert(adminPassword, "Admin's password isn't provided. Check your environment variables: ADMIN_PASSWORD.");

    await prisma.user.create({
        data: {
            email: adminEmail,
            role: 'ADMIN',
            accounts: {
                create: {
                    type: 'credentials',
                    provider: 'credentials',
                    providerAccountId: 'credentials',
                    password: adminPassword,
                },
            },
        },
    });
});

seed('Default flows and states', async () => {
    await prisma.flow.create({
        data: {
            title: 'Goal — Default',
            recommended: true,
            states: {
                create: [
                    ['Draft', 1],
                    ['inProgress', 194],
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
    });
});
