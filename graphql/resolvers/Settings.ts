import { arg, nonNull } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Settings, SettingsInput } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.field('settings', {
        type: Settings,
        resolve: async (_, __, { db, activity }) => {
            if (!activity) return null;

            const activityWithSettings = await db.activity.findUnique({
                where: {
                    id: activity.id,
                },
                include: {
                    settings: true,
                },
            });

            if (!activityWithSettings) return null;

            return activityWithSettings.settings;
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
                return db.settings.update({
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
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
