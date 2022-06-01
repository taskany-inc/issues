import NextLink from 'next/link';

import { routes } from '../hooks/router';

import { TaskanyLogo } from './TaskanyLogo';

export const HeaderLogo: React.FC = () => {
    // TODO: resolve custom logo from settings in db

    return (
        <NextLink href={routes.index()}>
            <a>
                <TaskanyLogo />
            </a>
        </NextLink>
    );
};
