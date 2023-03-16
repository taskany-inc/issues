import { getSession } from 'next-auth/react';

import { SSRProps } from '../../../types/ssrProps';

import { tr } from './AdminPage.i18n';

export const AdminPage = () => (
    <div>
        <h1>{tr('This page is protected AdminPanel')}</h1>
        <p>{tr('Only admin users can see this page.')}</p>
    </div>
);

export const getServerSideProps: SSRProps = async ({ req }) => {
    const session = await getSession({ req });

    if (session && session.user.role !== 'ADMIN') {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
};
