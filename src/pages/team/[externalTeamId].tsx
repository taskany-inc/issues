import { declareSsrProps } from '../../utils/declareSsrProps';
import { filtersPanelSsrInit } from '../../utils/filters';
import { TeamGroupedGoalsList } from '../../components/TeamGroupedGoalsList/TeamGroupedGoalsList';

export const getServerSideProps = declareSsrProps(
    async (props) => {
        const {
            params: { externalTeamId },
            ssrHelpers,
        } = props;

        const { defaultPresetFallback } = await filtersPanelSsrInit(props);

        await ssrHelpers.v2.project.getCrewTeamProjectGoals.fetchInfinite({ id: externalTeamId });

        return {
            defaultPresetFallback,
        };
    },
    {
        private: true,
    },
);

export default TeamGroupedGoalsList;
