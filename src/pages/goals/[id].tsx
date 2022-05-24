import { useEffect, useState } from 'react';
import useSWR, { unstable_serialize } from 'swr';

import { createFetcher } from '../../utils/createFetcher';
import { declareSsrProps } from '../../utils/declareSsrProps';
import { Page } from '../../components/Page';
import { declarePage } from '../../utils/declarePage';

const refreshInterval = 3000;

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

export const getServerSideProps = declareSsrProps(async ({ user, params: { id } }) => ({
    ssrData: await fetcher(user, id),
}));

export default declarePage(
    ({ user, locale, ssrData, params: { id } }) => {
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            const lazySubsTimer = setTimeout(() => setMounted(true), refreshInterval);

            return () => clearInterval(lazySubsTimer);
        }, []);

        const { data } = useSWR(mounted ? [user, id] : null, (...args) => fetcher(...args), {
            fallback: {
                [unstable_serialize([user, id])]: ssrData,
            },
            refreshInterval,
        });

        const { goal } = data ?? ssrData;

        return (
            <Page locale={locale} title={goal.title}>
                <h1>{goal.title}</h1>

                <pre>{JSON.stringify(goal, null, 2)}</pre>
            </Page>
        );
    },
    { private: true },
);
