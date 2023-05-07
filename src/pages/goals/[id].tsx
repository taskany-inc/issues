import { GoalPage } from '../../components/GoalPage/GoalPage';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, params: { id } }) => {
        const goal = await ssrHelpers.goal.getById.fetch(id);

        if (!goal) {
            return {
                notFound: true,
            };
        }
    },
    {
        private: true,
    },
);

export default GoalPage;
