import { arg, nonNull, stringArg } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Settings, SettingsInput } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.field('settings', {
        type: Settings,
        args: {
            activityId: nonNull(stringArg()),
        },
        resolve: async (_, { activityId }, { db }) => {
            const activity = await db.activity.findUnique({
                where: {
                    id: activityId,
                },
                include: {
                    settings: true,
                },
            });

            if (!activity) return null;

            return activity.settings;
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('updateSettings', {
        type: Settings,
        args: {
            data: nonNull(arg({ type: SettingsInput })),
        },
        resolve: async (_, { data: { id, ...data } }, { db }) => {
            try {
                const updatedSettings = await db.settings.update({
                    where: { id },
                    data,
                });

                // await mailServer.sendMail({
                //     from: '"Fred Foo 👻" <foo@example.com>',
                //     to: 'bar@example.com, baz@example.com',
                //     subject: 'Hello ✔',
                //     text: `new post '${title}'`,
                //     html: `new post <b>${title}</b>`,
                // });

                return updatedSettings;
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
