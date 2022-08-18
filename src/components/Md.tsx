import React from 'react';
import styled from 'styled-components';
import Head from 'next/head';

import { link10 } from '../design/@generated/themes';
import { md } from '../utils/md';

const StyledMd = styled.div`
    a {
        color: inherit;
        text-decoration: underline;

        transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
        transition-property: color;
        transition-duration: 0.1s;

        cursor: pointer;

        &:hover {
            color: ${link10};
        }
    }
`;

interface MdProps {
    children?: string;
}

export const Md: React.FC<MdProps> = ({ children }) => (
    <>
        <Head>
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/katex@0.15.0/dist/katex.min.css"
                crossOrigin="anonymous"
            />
        </Head>

        <StyledMd dangerouslySetInnerHTML={{ __html: md(children) }} />
    </>
);
