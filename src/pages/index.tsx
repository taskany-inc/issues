import type { NextPage, GetStaticPropsContext } from 'next';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';

import { createFetcher } from '../utils/createFetcher';
import { Header } from '../components/Header';

const fetcher = createFetcher(() => ({
    users: {
        id: true,
        name: true,
        email: true,
        image: true,
        created_at: true,
    },
}));

const Home: NextPage = () => {
    const { data: session } = useSession();
    const { data, error } = useSWR('users', () => fetcher());
    const t = useTranslations('index');

    return (
        <>
            <Head>
                <title>{t('title')}</title>
            </Head>

            <Header/>

            {session ? (
                <>
                    {session.user.role === 'ADMIN' && (
                        <div>
                            {data?.users && data.users.map((user) => <div key={user.id}>{JSON.stringify(user)}</div>)}
                        </div>
                    )}
                </>
            ) : (
                <>
                    Not signed in
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
