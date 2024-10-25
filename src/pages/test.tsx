import { refreshInterval } from '../utils/config';
import { declareSsrProps } from '../utils/declareSsrProps';
import { trpc } from '../utils/trpcClient';

export const getServerSideProps = declareSsrProps(
    async ({ ssrHelpers }) => {
        await ssrHelpers.user.settings.fetch();
    },
    {
        private: true,
    },
);

export default () => {
    const { data } = trpc.v2.project.getProjectGoalsById.useInfiniteQuery(
        { id: 'TSTVDM', goalsQuery: { sort: [{ key: 'rank', dir: 'asc' }] }, limit: 100 },
        {
            keepPreviousData: true,
            staleTime: refreshInterval,
            getNextPageParam: ({ pagination }) => pagination.offset,
        },
    );
    return (
        <pre style={{ color: 'beige' }}>
            {JSON.stringify(
                data?.pages[0].goals.map((g) => g.title),
                null,
                2,
            )}
        </pre>
    );
};
