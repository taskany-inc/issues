import { router, protectedProcedure } from '../trpcBackend';
import { getProjectList } from '../queries/projectV2';
import { userProjectsSchema } from '../../src/schema/project';

export const project = router({
    userProjects: protectedProcedure.input(userProjectsSchema).query(async ({ ctx, input: { take, filter } }) => {
        const { activityId, role } = ctx.session.user;
        try {
            const query = getProjectList({
                activityId,
                role,
                limit: take,
                filter,
            });

            const res = await query.execute();

            return res;
        } catch (error) {
            console.error(error);

            return Promise.reject();
        }
    }),
});
