import { DashboardPage, projectsLimit } from '../components/DashboardPage/DashboardPage';
import { declareSsrProps } from '../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../utils/filters';

export const getServerSideProps = declareSsrProps(
    async (params) => {
        const { queryState, defaultPresetFallback, redirect } = await filtersPanelSsrInit(params);

        if (redirect) {
            return redirect;
        }

        const { ssrHelpers } = params;

        await ssrHelpers.project.getUserProjectsWithGoals.fetchInfinite({
            goalsQuery: queryState,
            limit: projectsLimit,
        });

        return {
            defaultPresetFallback,
        };
    },
    {
        private: true,
    },
);

export default DashboardPage;
