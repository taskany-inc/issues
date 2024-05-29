import React from 'react';

import { useMarkdown } from '../hooks/useMarkdown';

interface MdProps {
    children?: string;
    className?: string;
}

const Md: React.FC<MdProps> = ({ children = '', className, ...attr }) => (
    <div className={className} {...attr}>
        {useMarkdown(children)}
    </div>
);

export default Md;
