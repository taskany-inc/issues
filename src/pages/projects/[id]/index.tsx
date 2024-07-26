import { TRPCError } from '@trpc/server';

import { ProjectPage } from '../../../components/ProjectPage/ProjectPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../../utils/filters';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { queryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

        const {
            params: { id },
            ssrHelpers,
        } = props;

        try {
            const project = await ssrHelpers.project.getById.fetch({ id, goalsQuery: queryState });

            if (!project) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            await ssrHelpers.project.getDeepInfo.fetch({
                id,
                goalsQuery: queryState,
            });
        } catch (e: unknown) {
            if (e instanceof TRPCError && (e.code === 'FORBIDDEN' || e.code === 'NOT_FOUND')) {
                return {
                    notFound: true,
                };
            }
        }

        return {
            defaultPresetFallback,
        };
    },
    {
        private: true,
    },
);

export default ProjectPage;
