import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { getGroupListSchema } from '../../src/schema/crew';
import { Team } from '../../src/types/crew';
import { protectedProcedure, router } from '../trpcBackend';

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
});
