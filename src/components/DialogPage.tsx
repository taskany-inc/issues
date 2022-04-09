import Head from 'next/head';
import styled from 'styled-components';
import { Text, Grid } from '@geist-ui/core';

import { Header } from './Header';

interface DialogPageProps {
    title?: string;
    heading?: string;
}

const StyledDialogPage = styled.main`
    padding: 40px 20px;
`;

const CleanFlexContainer = styled.div`
    width: 100%;
`;

export const DialogPage: React.FC<DialogPageProps> = ({ title, heading, children }) => {
    return (
        <>
            <Head>
                <title>{title}</title>
            </Head>

            <Header />

            <StyledDialogPage>
                <Grid.Container gap={0}>
                    <Grid xs={1} />
                    <Grid xs={23}>
                        <CleanFlexContainer>
                            {heading && <Text h1>{heading}</Text>}
                            {children}
                        </CleanFlexContainer>
                    </Grid>
                </Grid.Container>
            </StyledDialogPage>
        </>
    );
};
