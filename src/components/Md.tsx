import React from 'react';
import styled from 'styled-components';

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

export const Md: React.FC<MdProps> = ({ children }) => <StyledMd dangerouslySetInnerHTML={{ __html: md(children) }} />;
