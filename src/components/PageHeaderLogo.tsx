import NextLink from 'next/link';
import { TaskanyLogo } from '@taskany/bricks/harmony';

import { routes } from '../hooks/router';

export const PageHeaderLogo: React.FC<{ logo?: string }> = ({ logo }) => (
    <NextLink href={routes.index()} passHref>
        <TaskanyLogo src={logo} />
    </NextLink>
);
