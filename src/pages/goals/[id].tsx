import { Goal } from '@prisma/client';
import { useRouter } from 'next/router';
import Head from 'next/head';
import useSWR from 'swr';
import { getSession, useSession } from 'next-auth/react';

import { SSRPageProps, SSRProps } from '../../types/ssrProps';
import { createFetcher } from '../../utils/createFetcher';
import { Header } from '../../components/Header';

const fetcher = createFetcher((user, id: string) => ({
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
        },
    ],
}));

function Page({ goal }: SSRPageProps<{ goal: Goal }>) {
    const router = useRouter();
    const { id } = router.query as Record<string, string>;
    const { data: session } = useSession();
    const { data } = useSWR('goal', () => fetcher(session!.user, id));

    const actual = data?.goal ?? goal;

    return (
        <>
            <Head>
                <title>{actual.title}</title>
            </Head>

            <Header />

            <div>
                <h1>{actual.title}</h1>
            </div>
        </>
    );
}

Page.auth = true;

export const getServerSideProps: SSRProps<{ id: string }> = async ({ locale, req, params }) => {
    const session = await getSession({ req });
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { goal } = await fetcher(session!.user, params!.id);

    return {
        props: {
            goal,
            i18n: (await import(`../../../i18n/${locale}.json`)).default,
        },
    };
};

export default Page;
