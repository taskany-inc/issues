import React from 'react';
import { Md as Markdown } from '@taskany/bricks';

import { useMarkdown } from '../hooks/useMarkdown';

interface MdProps {
    children?: string;
    className?: string;
}

const Md: React.FC<MdProps> = ({ children = '', className, ...attr }) => (
    <Markdown className={className} {...attr}>
        {useMarkdown(children)}
    </Markdown>
);

export default Md;
