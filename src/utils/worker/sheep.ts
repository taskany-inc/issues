import { prisma } from '../prisma';

const sheepEmail = process.env.SHEEP_EMAIL || 'sheep@taskany.org';
const sheepPassword = process.env.SHEEP_PASSWORD || 'taskany';
const sheepAvatar = process.env.SHEEP_AVATAR || '/sheep.png';

export const getSheep = () =>
    prisma.user.findUnique({
        where: {
            email: sheepEmail,
        },
    });

export const createSheep = () =>
    prisma.user.create({
        data: {
            email: sheepEmail,
            image: sheepAvatar,
            name: 'Taskany Sheep',
            role: 'USER',
            accounts: {
                create: {
                    type: 'credentials',
                    provider: 'email',
                    providerAccountId: 'sheepCredentials',
                    password: sheepPassword,
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
    });
