import { Grid, Link, Spacer, Popover } from '@geist-ui/core';
import { useSession, signOut } from 'next-auth/react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';

import { HeaderLogo } from './HeaderLogo';
import { Icon } from './Icon';
import { ThemeChanger } from './ThemeChanger';
import { UserPic } from './UserPic';
import { routes } from '../hooks/router';

const StyledHeader = styled.header`
    padding: 20px 20px;
`;

const StyledUserMenu = styled.div`
    display: flex;
    align-content: center;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
`;

const StyledPopoverContent = styled.div`
    min-width: 120px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const StyledHeaderNavLink = styled(Link)`
    font-size: 18px !important;
    font-weight: 600;
`;

const CreatorMenu = () => {
    const t = useTranslations('Header');

    const content = () => (
        <StyledPopoverContent>
            <Popover.Item>
                <NextLink href={routes.createGoal()}>
                    <Link>{t('New goal')}</Link>
                </NextLink>
            </Popover.Item>
            <Popover.Item>
                <NextLink href={routes.createTeam()}>
                    <Link>{t('New team')}</Link>
                </NextLink>
            </Popover.Item>
            <Popover.Item line />
            <Popover.Item>
                <Link onClick={() => signOut()}>{t('Sign out')}</Link>
            </Popover.Item>
        </StyledPopoverContent>
    );
    return (
        <Popover content={content} hideArrow>
            <StyledIcon type="plus" size="s" />
        </Popover>
    );
};

export const Header: React.FC = () => {
    const { data: session } = useSession();
    const t = useTranslations('Header');

    return (
        <StyledHeader>
            <Grid.Container gap={0}>
                <Grid xs={1}>
                    <NextLink href={routes.index()}>
                        <Link>
                            <HeaderLogo />
                        </Link>
                    </NextLink>
                </Grid>
                <Grid xs={19}>
                    <NextLink href={routes.teams()}>
                        <StyledHeaderNavLink>{t('Teams')}</StyledHeaderNavLink>
                    </NextLink>
                    <Spacer w={2} />
                    <NextLink href={routes.goals()}>
                        <StyledHeaderNavLink>{t('Goals')}</StyledHeaderNavLink>
                    </NextLink>
                    <Spacer w={2} />
                    <NextLink href={'#'}>
                        <StyledHeaderNavLink>{t('Boards')}</StyledHeaderNavLink>
                    </NextLink>
                </Grid>
                <Grid xs={4}>
                    <StyledUserMenu>
                        <ThemeChanger />
                        <Spacer w={1} />
                        <CreatorMenu />
                        <Spacer w={1} />
                        <UserPic src={session?.user.image} title={session?.user.name} size={32} />
                    </StyledUserMenu>
                </Grid>
            </Grid.Container>
        </StyledHeader>
    );
};
