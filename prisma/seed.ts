import assert from 'assert';

import { prisma } from '../src/utils/prisma';

seed('Admin user', async () => {
    assert(process.env.ADMIN_EMAIL, "Admin's email isn't provided. Check your environment variables: ADMIN_EMAIL.");
    assert(
        process.env.ADMIN_PASSWORD,
        "Admin's password isn't provided. Check your environment variables: ADMIN_PASSWORD.",
    );

    await prisma.user.create({
        data: {
            email: process.env.ADMIN_EMAIL!,
            role: 'ADMIN',
            accounts: {
                create: {
                    type: 'credentials',
                    provider: 'credentials',
                    providerAccountId: 'credentials',
                    password: process.env.ADMIN_PASSWORD!,
                },
            },
        },
    });
});

seed('Default flows and states', async () => {
    await prisma.flow.create({
        data: {
            title: 'Goal — Default',
            states: {
                create: ['Draft', 'inProgress', 'Blocked', 'Finished', 'Failed', 'Canceled'].map((title) => ({
                    title,
                })),
            },
        },
    });
});

async function seed(title: string, cb: () => void) {
    console.log('SEED:', title, '...');
    await cb();
    console.log('done!');
}
