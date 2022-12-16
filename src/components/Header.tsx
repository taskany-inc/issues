import NextLink from 'next/link';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';

import { routes } from '../hooks/router';
import { textColor, gray7, colorPrimary, gray3 } from '../design/@generated/themes';

import { HeaderLogo } from './HeaderLogo';
import { HeaderMenu } from './HeaderMenu';
import { Icon } from './Icon';

const StyledHeader = styled.header`
    display: grid;
    grid-template-columns: 20px 11fr 100px;
    align-items: center;
    padding: 20px 40px;

    background-color: ${gray3};
`;

const StyledNav = styled.nav`
    padding-left: 40px;
`;

const StyledSearch = styled.div`
    position: relative;
    display: inline-block;
    margin-left: 30px;
    top: 3px;
`;

const StyledHeaderNavLink = styled.a<{ disabled?: boolean }>`
    display: inline-block;
    padding-bottom: 2px;
    margin-top: 3px;

    font-size: 18px;
    font-weight: 600;
    color: ${textColor};
    text-decoration: none;

    border-bottom: 1px solid transparent;

    transition: color, border-color 250ms ease-in-out;

    &:hover {
        color: ${textColor};
        border-color: ${colorPrimary};
    }

    ${({ disabled }) =>
        disabled &&
        `
            color: ${gray7};
        `}

    & + & {
        margin-left: 24px;
    }
`;

export const Header: React.FC = () => {
    const t = useTranslations('Header');

    return (
        <StyledHeader>
            <HeaderLogo />

            <StyledNav>
                <NextLink href={routes.goals()} passHref>
                    <StyledHeaderNavLink>{t('Goals')}</StyledHeaderNavLink>
                </NextLink>
                <StyledHeaderNavLink disabled>{t('Issues')}</StyledHeaderNavLink>
                <StyledHeaderNavLink disabled>{t('Boards')}</StyledHeaderNavLink>
                <NextLink href={routes.exploreProjects()} passHref>
                    <StyledHeaderNavLink>{t('Explore')}</StyledHeaderNavLink>
                </NextLink>

                <StyledSearch>
                    <Icon type="search" size="s" color={gray7} />
                </StyledSearch>
            </StyledNav>

            <HeaderMenu notifications />
        </StyledHeader>
    );
};
