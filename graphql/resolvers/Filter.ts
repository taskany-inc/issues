import { arg, nonNull } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Filter, FilterCreateInput, FilterInput, Activity, SubscriptionToggleInput } from '../types';
import { connectionMap } from '../queries/connections';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.field('filter', {
        type: Filter,
        args: {
            data: nonNull(arg({ type: FilterInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            const filter = await db.filter.findUnique({
                where: {
                    id: data.id,
                },
                include: {
                    stargizers: true,
                },
            });

            if (!filter) return null;

            return {
                ...filter,
                _isOwner: filter?.activityId === activity.id,
                _isStarred: filter?.stargizers?.some((stargizer) => stargizer?.id === activity.id),
            };
        },
    });
};

export const mutation = (t: ObjectDefinitionBlock<'Mutation'>) => {
    t.field('createFilter', {
        type: Filter,
        args: {
            data: nonNull(arg({ type: FilterCreateInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.filter.create({
                    data: {
                        ...data,
                        activityId: activity.id,
                    },
                });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });

    t.field('toggleFilterStargizer', {
        type: Activity,
        args: {
            data: nonNull(arg({ type: SubscriptionToggleInput })),
        },
        resolve: async (_, { data: { id, direction } }, { db, activity }) => {
            if (!activity) return null;

            const connection = { id };

            try {
                return db.activity.update({
                    where: { id: activity.id },
                    data: {
                        filterStargizers: { [connectionMap[String(direction)]]: connection },
                    },
                });

                // await mailServer.sendMail({
                //     from: `"Fred Foo 👻" <${process.env.MAIL_USER}>`,
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

    t.field('deleteFilter', {
        type: Filter,
        args: {
            data: nonNull(arg({ type: FilterInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.filter.delete({
                    where: { id: data.id },
                });
            } catch (error) {
                throw Error(`${error}`);
            }
        },
    });
};
