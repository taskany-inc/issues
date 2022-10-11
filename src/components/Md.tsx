import React, { useContext } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { link10 } from '../design/@generated/themes';
import { md } from '../utils/md';
import { pageContext } from '../utils/pageContext';

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

const themes = {
    dark: dynamic(() => import('../design/prismThemes/DarkPrismCss')),
    light: dynamic(() => import('../design/prismThemes/LightPrismCss')),
};

const Md: React.FC<MdProps> = ({ children }) => {
    const { theme } = useContext(pageContext);

    const PrismCss = theme ? themes[theme] : themes.dark;
    return (
        <>
            <PrismCss />
            <StyledMd dangerouslySetInnerHTML={{ __html: md(children) }} />
        </>
    );
};

export default Md;
