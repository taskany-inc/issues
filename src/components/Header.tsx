import { useCallback, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';

import { routes } from '../hooks/router';
import { secondaryTaskanyLogoColor, textColorPrimary } from '../design/@generated/themes';

import { HeaderLogo } from './HeaderLogo';
import { Icon } from './Icon';
import { ThemeChanger } from './ThemeChanger';
import { UserPic } from './UserPic';
import { Popup } from './Popup';

const StyledHeader = styled.header`
    display: grid;
    grid-template-columns: 40px 10fr 1fr;
    align-items: center;
    padding: 20px 20px;
`;

const StyledUserMenu = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-items: center;
    align-items: center;
`;

const StyledPopupContent = styled.div`
    min-width: 120px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const StyledHeaderNavLink = styled.a`
    font-size: 18px;
    font-weight: 500;
    text-decoration: none;
    color: ${textColorPrimary};

    & + & {
        margin-left: 20px;
    }
`;

const CreatorMenu = () => {
    const t = useTranslations('Header');
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const [popupVisible, setPopupVisibility] = useState(false);

    const onClickOutside = useCallback(() => {
        setPopupVisibility(false);
    }, []);

    return (
        <>
            <span ref={popupRef}>
                <StyledIcon
                    ref={buttonRef}
                    onClick={() => setPopupVisibility(!popupVisible)}
                    color={secondaryTaskanyLogoColor}
                    type="plus"
                    size="s"
                />
            </span>

            <Popup
                overflow="hidden"
                visible={popupVisible}
                onClickOutside={onClickOutside}
                reference={popupRef}
                interactive
                minWidth={150}
                maxWidth={250}
            >
                <StyledPopupContent>
                    <div>
                        <NextLink href={routes.createGoal()}>
                            <a>{t('New goal')}</a>
                        </NextLink>
                    </div>
                    <div>
                        <NextLink href={routes.createProject()}>
                            <a>{t('New project')}</a>
                        </NextLink>
                    </div>
                    <div>
                        <NextLink href={routes.inviteUsers()}>
                            <a>{t('Invite users')}</a>
                        </NextLink>
                    </div>
                    <div>
                        <a onClick={() => signOut()}>{t('Sign out')}</a>
                    </div>
                </StyledPopupContent>
            </Popup>
        </>
    );
};

export const Header: React.FC = () => {
    const { data: session } = useSession();
    const t = useTranslations('Header');

    return (
        <StyledHeader>
            <HeaderLogo />

            <div>
                <NextLink href={routes.goals()} passHref>
                    <StyledHeaderNavLink>{t('Goals')}</StyledHeaderNavLink>
                </NextLink>
                <NextLink href={routes.projects()} passHref>
                    <StyledHeaderNavLink>{t('Projects')}</StyledHeaderNavLink>
                </NextLink>
                <NextLink href={'#'} passHref>
                    <StyledHeaderNavLink>{t('Boards')}</StyledHeaderNavLink>
                </NextLink>
            </div>

            <StyledUserMenu>
                <ThemeChanger />

                <CreatorMenu />

                <UserPic src={session?.user.image} size={32} />
            </StyledUserMenu>
        </StyledHeader>
    );
};
