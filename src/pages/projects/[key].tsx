import Head from 'next/head';
import useSWR from 'swr';

import { createFetcher } from '../../utils/createFetcher';
import { Goal, Project } from '../../../graphql/@generated/genql';
import { Header } from '../../components/Header';
import { declareSsrProps, ExternalPageProps } from '../../utils/declareSsrProps';

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
            computedActivity: {
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

export const getServerSideProps = declareSsrProps(
    async ({ user, params: { key } }) => ({
        ssrData: await fetcher(user, key),
    }),
    {
        private: true,
    },
);

function Page({
    user,
    ssrData,
    params: { key },
}: ExternalPageProps<{ project: Project; projectGoals: Goal[] }, { key: string }>) {
    const { data } = useSWR('project', () => fetcher(user, key));

    const actualProject = data?.project ?? ssrData.project;
    const actualGoals = data?.projectGoals ?? ssrData.projectGoals;

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

export default Page;
