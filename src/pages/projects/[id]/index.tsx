import { TRPCError } from '@trpc/server';

import { ProjectPage } from '../../../components/ProjectPage/ProjectPage';
import { declareSsrProps } from '../../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../../utils/filters';
import { projectCollapsableItemInit } from '../../../utils/projectCollapsableItemInit';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const { queryState, defaultPresetFallback } = await filtersPanelSsrInit(props);

        const {
            params: { id },
            ssrHelpers,
        } = props;

        try {
            const project = await ssrHelpers.v2.project.getById.fetch({ id });

            if (!project) {
                throw new TRPCError({ code: 'NOT_FOUND' });
            }

            await Promise.all([
                ssrHelpers.v2.project.getProjectChildrenTree.fetch({
                    id,
                    goalsQuery: queryState,
                }),
                projectCollapsableItemInit({
                    project,
                    queryState,
                    params: props,
                }),
            ]);
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
