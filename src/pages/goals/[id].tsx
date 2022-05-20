import useSWR from 'swr';

import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { Page } from '../../components/Page';
import { declarePage } from '../../utils/declarePage';

const fetcher = createFetcher((_, id: string) => ({
    goal: [
        {
            id,
        },
        {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            project: {
                slug: true,
                title: true,
                description: true,
            },
        },
    ],
}));

export const getServerSideProps = declareSsrProps(async ({ user, params }) => ({
    ssrData: await fetcher(user, params.id),
}));

export default declarePage(
    ({ user, locale, ssrData, params: { id } }) => {
        const { data } = useSWR('goal', () => fetcher(user, id));

        const goal = data?.goal ?? ssrData;

        return (
            <Page locale={locale} title={goal.title}>
                <h1>{goal.title}</h1>

                <pre>{JSON.stringify(goal, null, 2)}</pre>
            </Page>
        );
    },
    { private: true },
);
