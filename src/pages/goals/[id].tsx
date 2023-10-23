import { TRPCError } from '@trpc/server';

import { GoalPage } from '../../components/GoalPage/GoalPage';
import { declareSsrProps } from '../../utils/declareSsrProps';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, params: { id } }) => {
        try {
            const goal = await ssrHelpers.goal.getById.fetch(id);

            if (!goal) {
                throw new TRPCError({ code: 'NOT_FOUND' });
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

export default GoalPage;
