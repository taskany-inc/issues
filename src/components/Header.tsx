import { useCallback, useEffect, useState } from 'react';
import { Grid, Link, Spacer, Popover } from '@geist-ui/core';
import { useRouter as useNextRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import tinykeys from 'tinykeys';

import { HeaderLogo } from './HeaderLogo';
import { Icon } from './Icon';
import { ThemeChanger } from './ThemeChanger';
import { UserPic } from './UserPic';
import { CreateProject } from './CreateProject';
import { routes, useRouter } from '../hooks/router';
import { secondaryTaskanyLogoColor } from '../design/@generated/themes';
import { createProjectKeys, createHotkeys, inviteUserKeys } from '../utils/hotkeys';
import { InviteUser } from './InviteUser';
import { DialogModal } from './DialogModal';

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
                <NextLink href={routes.createProject()}>
                    <Link>{t('New project')}</Link>
                </NextLink>
            </Popover.Item>
            <Popover.Item>
                <NextLink href={routes.inviteUsers()}>
                    <Link>{t('Invite users')}</Link>
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
            <StyledIcon type="plus" size="s" color={secondaryTaskanyLogoColor} />
        </Popover>
    );
};

const CreateProjectFromModal = () => {
    const nextRouter = useNextRouter();
    const router = useRouter();
    const t = useTranslations('projects.new');
    const [modalVisible, setModalVisibility] = useState(false);
    const isCreateProjectPath = nextRouter.pathname === routes.createProject();
    const showModalOrNavigate = (navigate: () => void) => (isCreateProjectPath ? navigate() : setModalVisibility(true));
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() =>
        tinykeys(window, createHotkeys([createProjectKeys, () => showModalOrNavigate(router.createProject)])),
    );

    return (
        <DialogModal heading={t('Create new project')} visible={modalVisible} onClose={onModalClose}>
            <CreateProject onCreate={(id) => id && router.project(id)} />
        </DialogModal>
    );
};

const InviteUsersFromModal = () => {
    const nextRouter = useNextRouter();
    const router = useRouter();
    const t = useTranslations('users.invite');
    const [modalVisible, setModalVisibility] = useState(false);
    const isInviteUsersPath = nextRouter.pathname === routes.inviteUsers();
    const showModalOrNavigate = (navigate: () => void) => (isInviteUsersPath ? navigate() : setModalVisibility(true));
    const onModalClose = useCallback(() => setModalVisibility(false), [setModalVisibility]);

    useEffect(() => tinykeys(window, createHotkeys([inviteUserKeys, () => showModalOrNavigate(router.inviteUsers)])));

    return (
        <DialogModal heading={t('Invite new user')} visible={modalVisible} onClose={onModalClose}>
            <InviteUser onCreate={() => setModalVisibility(false)} />
        </DialogModal>
    );
};

export const Header: React.FC = () => {
    const { data: session } = useSession();
    const t = useTranslations('Header');

    return (
        <>
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
                        <NextLink href={routes.projects()}>
                            <StyledHeaderNavLink>{t('Projects')}</StyledHeaderNavLink>
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
                            <UserPic src={session?.user.image} size={32} />
                        </StyledUserMenu>
                    </Grid>
                </Grid.Container>
            </StyledHeader>

            <CreateProjectFromModal />
            <InviteUsersFromModal />
        </>
    );
};
