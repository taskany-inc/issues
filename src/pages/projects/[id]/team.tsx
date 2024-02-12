import { TRPCError } from '@trpc/server';

import { ProjectTeamPage } from '../../../components/ProjectTeamPage/ProjectTeamPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, params: { id } }) => {
        try {
            const project = await ssrHelpers.project.getById.fetch({ id });

            if (!project || !process.env.NEXT_PUBLIC_CREW_URL) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            if (project.teams) {
                await ssrHelpers.crew.getTeamByIds.fetch({
                    ids: project.teams.map(({ externalTeamId }) => externalTeamId),
                });
            }
        } catch (e: unknown) {
            if (e instanceof TRPCError && (e.code === 'FORBIDDEN' || e.code === 'NOT_FOUND')) {
                return {
                    notFound: true,
                };
            }
        }
    },
    {
        private: true,
    },
);

export default ProjectTeamPage;
