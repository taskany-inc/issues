import React from 'react';
import styled from 'styled-components';
import { useRemark, useRemarkSync } from 'react-remark';
import remarkGFM from 'remark-gfm';
import remarkEmoji from 'remark-emoji';
import { link10, radiusS } from '@taskany/colors';

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

    img {
        max-width: 100%;
        border-radius: ${radiusS};
    }
`;

interface MdProps {
    children?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ssrRenderOptions: any = {
    remarkPlugins: [remarkEmoji],
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clientRenderOptions: any = {
    remarkPlugins: [remarkGFM, remarkEmoji],
};

const Md: React.FC<MdProps> = ({ children = '' }) => {
    const ssrContent = useRemarkSync(children, ssrRenderOptions);
    const [clientContent] = useRemark(clientRenderOptions);

    return <StyledMd>{clientContent ?? ssrContent}</StyledMd>;
};

export default Md;
