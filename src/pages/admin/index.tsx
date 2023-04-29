import { getSession } from 'next-auth/react';

import { AdminPage } from '../../components/AdminPage/AdminPage';
import { SSRProps } from '../../types/ssrProps';

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

export default AdminPage;
