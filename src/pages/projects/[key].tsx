import { useRouter } from 'next/router';
import Head from 'next/head';
import useSWR from 'swr';
import { getSession, useSession } from 'next-auth/react';

import { SSRPageProps, SSRProps } from '../../types/ssrProps';
import { createFetcher } from '../../utils/createFetcher';
import { Goal, Project } from '../../../graphql/@generated/genql';
import { Header } from '../../components/Header';

const fetcher = createFetcher((_, key: string) => ({
    project: [
        {
            key,
        },
        {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            computedOwner: {
                id: true,
                name: true,
                email: true,
            },
        },
    ],
    projectGoals: [
        {
            key,
        },
        {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            computedOwner: {
                id: true,
                name: true,
                email: true,
            },
        },
    ],
}));

function Page({ project, projectGoals }: SSRPageProps<{ project: Project; projectGoals: Goal[] }>) {
    const router = useRouter();
    const { slug } = router.query as Record<string, string>;
    const { data: session } = useSession();
    const { data } = useSWR('project', () => fetcher(session?.user, slug));

    const actualProject = data?.project ?? project;
    const actualGoals = data?.projectGoals ?? projectGoals;

    return (
        <>
            <Head>
                <title>{actualProject.title}</title>
            </Head>

            <Header />

            <div>
                <h1>{actualProject.title}</h1>

                <div>{JSON.stringify(actualProject)}</div>
                <div>{JSON.stringify(actualGoals)}</div>
            </div>
        </>
    );
}

Page.auth = true;

export const getServerSideProps: SSRProps<{ key: string }> = async ({ locale, req, params }) => {
    const session = await getSession({ req });
    const { project, projectGoals } = await fetcher(session?.user, params!.key);

    return {
        props: {
            project,
            projectGoals,
            i18n: (await import(`../../../i18n/${locale}.json`)).default,
        },
    };
};

export default Page;
