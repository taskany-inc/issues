import NextLink from 'next/link';
import { TaskanyLogo } from '@taskany/bricks';

import { routes } from '../hooks/router';

export const PageHeaderLogo: React.FC = () => {
    // TODO: resolve custom logo from settings in db

    return (
        <NextLink href={routes.index()} passHref>
            <TaskanyLogo />
        </NextLink>
    );
};
