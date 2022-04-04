import { Post } from '@prisma/client';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { getSession, useSession } from 'next-auth/react';

import { SSRPageProps, SSRProps } from '../../types/ssrProps';
import { createFetcher } from '../../utils/createFetcher';

const fetcher = createFetcher((user, id: string) => ({
    post: [
        {
            id,
            user,
        },
        {
            id: true,
            title: true,
            content: true,
            created_at: true,
            author: {
                id: true,
                name: true,
            },
        },
    ],
}));

function Page({ post }: SSRPageProps<{ post: Post }>) {
    const router = useRouter();
    const { id } = router.query as Record<string, string>;
    const { data: session } = useSession();
    const { data, error } = useSWR('post', fetcher(session!.user, id));

    const actual = data?.post ?? post;

    return (
        <div>
            <h1>{actual.title}</h1>
        </div>
    );
}

Page.auth = true;

export const getServerSideProps: SSRProps<{ id: string }> = async ({ req, params }) => {
    const session = await getSession({ req });
    const { post } = await fetcher(session!.user, params!.id)();

    return {
        props: {
            post,
        },
    };
};

export default Page;
