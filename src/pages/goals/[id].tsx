import { TRPCError } from '@trpc/server';

import { GoalPage } from '../../components/GoalPage/GoalPage';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { routes } from '../../hooks/router';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers, params: { id } }) => {
        const goal = await ssrHelpers.goal.recognizeGoalScopeIdById.fetch(id);
        if (!goal?.projectId || !goal?.scopeId) {
            return {
                notFound: true,
            };
        }
        const realId = `${goal.projectId}-${goal.scopeId}`;

        if (realId !== id) {
            return {
                redirect: {
                    destination: routes.goal(realId),
                    statusCode: 302,
                },
            };
        }

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
