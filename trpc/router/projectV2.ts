import { router, protectedProcedure } from '../trpcBackend';
import { getProjectList } from '../queries/projectV2';

export const project = router({
    userProjects: protectedProcedure.query(async ({ ctx }) => {
        try {
            const query = getProjectList(ctx.session.user);

            const res = await query.execute();

            return res;
        } catch (error) {
            console.error(error);

            return Promise.reject();
        }
    }),
});
