import React from 'react';
import { Md as Markdown } from '@taskany/bricks';

import { useMarkdown } from '../hooks/useMarkdown';

interface MdProps {
    children?: string;
}

const Md: React.FC<MdProps> = ({ children = '' }) => <Markdown>{useMarkdown(children)}</Markdown>;

export default Md;
