import NextLink from 'next/link';
import styled from 'styled-components';

import { routes } from '../hooks/router';

import { TaskanyLogo } from './TaskanyLogo';

const StyledLogo = styled.span`
    justify-self: center;

    transition: transform 200ms ease-in-out;

    &:hover {
        transform: scale(1.08);
    }
`;

export const HeaderLogo: React.FC = () => {
    // TODO: resolve custom logo from settings in db

    return (
        <StyledLogo>
            <NextLink href={routes.index()}>
                <a>
                    <TaskanyLogo />
                </a>
            </NextLink>
        </StyledLogo>
    );
};
