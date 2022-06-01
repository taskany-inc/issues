import Head from 'next/head';
import styled from 'styled-components';

import { Header } from './Header';

interface DialogPageProps {
    title?: string;
}

const StyledDialogPage = styled.main`
    display: grid;
    grid-template-columns: 40px 11fr;
    padding: 40px 20px;
`;

export const DialogPage: React.FC<DialogPageProps> = ({ title, children }) => {
    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>

            <Header />

            <StyledDialogPage>
                <div />
                {children}
            </StyledDialogPage>
        </>
    );
};
