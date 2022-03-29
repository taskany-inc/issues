import type { NextPage, GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { useSession, signIn, signOut } from 'next-auth/react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { Button } from '@geist-ui/core';
import styled from 'styled-components';

import { createFetcher } from '../utils/createFetcher';
import { Header } from '../components/Header';

const fetcher = createFetcher(() => ({
    users: {
        id: true,
        name: true,
        email: true,
        image: true,
        created_at: true,
        posts: {
            id: true,
            title: true,
        },
    },
}));

const Btn = styled(Button)`
    font-weight: 600 !important;
`;

const Home: NextPage = () => {
    const { data: session } = useSession();
    const { data, error } = useSWR('users', fetcher());
    const t = useTranslations('index');

    return (
        <>
            <Head>
                <title>Taskany Goals</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header/>

            {session ? (
                <>
                    {t('signed in as')} {session!.user?.email} <br />

                    <Btn ghost type='secondary' scale={0.8} onClick={() => signOut()}>Sign out</Btn>

                    {session.user.role === 'ADMIN' && (
                        <div>
                            {data?.users && data.users.map((user) => <div key={user.id}>{JSON.stringify(user)}</div>)}
                        </div>
                    )}
                </>
            ) : (
                <>
                    Not signed in <br />
                    <button onClick={() => signIn()}>Sign in</button>
                </>
            )}
        </>
    );
};

export default Home;

export async function getStaticProps({ locale }: GetStaticPropsContext) {
    return {
        props: {
            i18n: (await import(`../../i18n/${locale}.json`)).default,
        },
    };
}
