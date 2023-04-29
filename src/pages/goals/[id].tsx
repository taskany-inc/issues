import { GoalPage } from '../../components/GoalPage/GoalPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { goalFetcher } from '../../utils/entityFetcher';

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { id } }) => {
        const ssrData = await goalFetcher(user, id);

        return ssrData.goal
            ? {
                  fallback: {
                      [id]: ssrData,
                  },
              }
            : {
                  notFound: true,
              };
    },
    {
        private: true,
    },
);

export default GoalPage;
