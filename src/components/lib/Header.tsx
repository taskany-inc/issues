import styled from 'styled-components';

import { textColor, gray7, colorPrimary, gray3 } from '../../design/@generated/themes';

import { Icon } from './Icon';
import { Link } from './Link';
import { TaskanyLogo } from './TaskanyLogo';
import { nullable } from './utils/nullable';

const StyledHeader = styled.header`
    display: grid;
    grid-template-columns: 20px 10fr 150px 55px;
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

const StyledCreateButton = styled.div`
    display: flex;
    align-items: center;
`;

const StyledLogo = styled.span`
    justify-self: center;

    transition: transform 200ms ease-in-out;

    &:hover {
        transform: scale(1.08);
    }
`;

export const HeaderNavLink = styled.a<{ disabled?: boolean }>`
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

const StyledHeaderMenu = styled.div`
    justify-self: end;
`;

export type HeaderNavItem = {
    title: string;
    href: string;
};

const DefaultNavLink: React.FC<HeaderNavItem> = ({ href, title }) => <HeaderNavLink href={href}>{title}</HeaderNavLink>;
const DefaultLogo: React.FC = () => (
    <Link href="/" inline>
        <TaskanyLogo />
    </Link>
);

export const Header: React.FC<{
    logo?: React.ReactNode;
    links?: HeaderNavItem[];
    linkComponent?: React.FC<HeaderNavItem>;
    actionButton?: React.ReactNode;
    menu?: React.ReactNode;
    onSearch?: (query: string) => void;
}> = ({
    menu,
    logo = <DefaultLogo />,
    links = [],
    linkComponent: LinkComponent = DefaultNavLink,
    onSearch,
    actionButton,
}) => (
    <StyledHeader>
        <StyledLogo>{logo}</StyledLogo>

        <StyledNav>
            {links.map((link, i) => (
                <LinkComponent key={i} {...link} />
            ))}

            {nullable(onSearch, () => (
                <StyledSearch>
                    <Icon type="search" size="s" color={gray7} />
                </StyledSearch>
            ))}
        </StyledNav>

        <StyledCreateButton>{actionButton}</StyledCreateButton>
        <StyledHeaderMenu>{menu}</StyledHeaderMenu>
    </StyledHeader>
);
