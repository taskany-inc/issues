import React from 'react';
import { Md as Markdown } from '@taskany/bricks';

import { trpc } from '../utils/trpcClient';

interface MdProps {
    children?: string;
}

const Md: React.FC<MdProps> = ({ children = '' }) => {
    const { data } = trpc.tools.md.useQuery(children);
    return <Markdown dangerouslySetInnerHTML={{ __html: data ?? '...' }}></Markdown>;
};

export default Md;
