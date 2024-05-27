import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getGroupListSchema } from '../../src/schema/crew';
import { CrewUser, Team } from '../../src/types/crew';
import { protectedProcedure, router } from '../trpcBackend';
import { prisma } from '../../src/utils/prisma';

const getToken = () => {
    const authorization = process.env.CREW_API_TOKEN;

    if (!authorization) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No api token for crew' });
    }

    return authorization;
};

export const crew = router({
    teamSuggetions: protectedProcedure.input(getGroupListSchema).query(async ({ input }) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_CREW_URL}/api/rest/groups/list`, {
            method: 'POST',
            headers: {
                authorization: getToken(),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        });

        const data: Omit<Team, 'memberships'>[] = await response.json();

        return data;
    }),
    getTeamByIds: protectedProcedure
        .input(
            z.object({
                ids: z.array(z.string()),
            }),
        )
        .query(async ({ input }) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_CREW_URL}/api/rest/groups/info`, {
                method: 'POST',
                headers: {
                    authorization: getToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: input.ids }),
            });

            const data: Team[] = await response.json();

            return data.map((team) => {
                const units = Number(
                    team.memberships.reduce((acum, { percentage = 0 }) => acum + percentage / 100, 0).toFixed(2),
                );

                return {
                    ...team,
                    units,
                };
            });
        }),
    getUsers: protectedProcedure
        .input(
            z.object({
                query: z.string(),
                filter: z.array(z.string()).optional(),
            }),
        )
        .query(async ({ input }): Promise<CrewUser[]> => {
            const { filter = [] } = input;

            if (!process.env.NEXT_PUBLIC_CREW_URL) {
                const data = await prisma.user.findMany({
                    where: {
                        OR: [
                            {
                                name: {
                                    contains: input.query,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                nickname: {
                                    contains: input.query,
                                    mode: 'insensitive',
                                },
                            },
                            {
                                email: {
                                    contains: input.query,
                                    mode: 'insensitive',
                                },
                            },
                        ],
                    },
                });
                return data.map((user) => ({ ...user, name: user.name || undefined, image: user.image || undefined }));
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_CREW_URL}/api/rest/search/users?query=${input.query}`,
                {
                    method: 'GET',
                    headers: {
                        authorization: getToken(),
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: response.statusText });
            }

            const data: CrewUser[] = await response.json();

            return data.filter((user) => !filter.includes(user.email));
        }),
});
