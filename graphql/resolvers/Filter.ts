import { arg, nonNull } from 'nexus';
import { ObjectDefinitionBlock } from 'nexus/dist/core';

import { Filter, FilterCreateInput, FilterInput } from '../types';

export const query = (t: ObjectDefinitionBlock<'Query'>) => {
    t.field('filter', {
        type: Filter,
        args: {
            data: nonNull(arg({ type: FilterInput })),
        },
        resolve: async (_, { data }, { db, activity }) => {
            if (!activity) return null;

            try {
                return db.filter.findUnique({
                    where: {
                        id: data.id,
                    },
                });
            } catch (error) {
                throw Error(`${error}`);
            }
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
