import { useRouter } from 'next/router';
import useSWR from 'swr';
import { getSession, useSession } from 'next-auth/react';

import { SSRPageProps, SSRProps } from '../../types/ssrProps';
import { createFetcher } from '../../utils/createFetcher';
import { Goal, Project } from '../../../graphql/@generated/genql';

const fetcher = createFetcher((user, slug: string) => ({
    project: [
        {
            slug,
        },
        {
            id: true,
            title: true,
            description: true,
            created_at: true,
            computedOwner: {
                id: true,
                name: true,
                email: true,
            },
        },
    ],
    projectGoals: [
        {
            slug,
        },
        {
            id: true,
            title: true,
            description: true,
            computedOwner: {
                id: true,
                name: true,
                email: true,
            },
        },
    ],
}));

function Page({ project, projectGoals }: SSRPageProps<{ project: Project; projectGoals: Goal }>) {
    const router = useRouter();
    const { slug } = router.query as Record<string, string>;
    const { data: session } = useSession();
    const { data } = useSWR('project', () => fetcher(session?.user, slug));

    const actualProject = data?.project ?? project;
    const actualGoals = data?.projectGoals ?? projectGoals;

    return (
        <div>
            <h1>{actualProject.title}</h1>

            <div>{JSON.stringify(actualProject)}</div>
            <div>{JSON.stringify(actualGoals)}</div>
        </div>
    );
}

Page.auth = true;

export const getServerSideProps: SSRProps<{ slug: string }> = async ({ req, params }) => {
    const session = await getSession({ req });
    const { project, projectGoals } = await fetcher(session?.user, params!.slug);

    return {
        props: {
            project,
            projectGoals,
        },
    };
};

export default Page;
