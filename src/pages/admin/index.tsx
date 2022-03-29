import { getSession } from 'next-auth/react';

import { SSRProps } from '../../types/ssrProps';

export default function AdminPanel() {
    return (
        <div>
            <h1>This page is protected AdminPanel</h1>
            <p>Only admin users can see this page.</p>
        </div>
    );
}

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
