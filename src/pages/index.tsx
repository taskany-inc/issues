import { DashboardPage } from '../components/DashboardPage/DashboardPage';
import { declareSsrProps } from '../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../utils/filters';
import { projectCollapsableItemInit } from '../utils/projectCollapsableItemInit';

export const getServerSideProps = declareSsrProps(
    async (params) => {
        const { queryState, defaultPresetFallback } = await filtersPanelSsrInit(params);

        const { ssrHelpers } = params;

        const data = await ssrHelpers.v2.project.getUserDashboardProjects.fetchInfinite({
            goalsQuery: {
                ...queryState,
                limit: 10,
            },
        });

        const project = data.pages[0].groups[0];

        if (project) {
            await projectCollapsableItemInit({
                project,
                queryState,
                params,
            });
        }

        return {
            defaultPresetFallback,
        };
    },
    {
        private: true,
    },
);

export default DashboardPage;
