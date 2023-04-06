import { useCallback } from 'react';
import NextLink from 'next/link';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { textColor, gray7, colorPrimary, gray3 } from '@taskany/colors';

import { routes } from '../hooks/router';
import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';

import { HeaderLogo } from './HeaderLogo';
import { HeaderMenu } from './HeaderMenu';
import { Icon } from './Icon';
import { Button } from './Button';
import { MenuItem } from './MenuItem';

const Dropdown = dynamic(() => import('./Dropdown'));

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

const StyledCreateButton = styled.div`
    display: flex;
    align-items: center;
`;

export const Header: React.FC = () => {
    const t = useTranslations('Header');

    const onMenuItemClick = useCallback(({ event }: { event: ModalEvent }) => {
        dispatchModalEvent(event)();
    }, []);

    return (
        <StyledHeader>
            <HeaderLogo />

            <StyledNav>
                <NextLink href={routes.goals()} passHref>
                    <StyledHeaderNavLink>{t('Goals')}</StyledHeaderNavLink>
                </NextLink>
                {/* <StyledHeaderNavLink disabled>{t('Issues')}</StyledHeaderNavLink> */}
                {/* <StyledHeaderNavLink disabled>{t('Boards')}</StyledHeaderNavLink> */}
                <NextLink href={routes.exploreTeams()} passHref>
                    <StyledHeaderNavLink>{t('Explore')}</StyledHeaderNavLink>
                </NextLink>

                <StyledSearch>
                    <Icon type="search" size="s" color={gray7} />
                </StyledSearch>
            </StyledNav>

            <StyledCreateButton>
                <Button
                    text={t('Create')}
                    view="primary"
                    outline
                    brick="right"
                    onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                />
                <Dropdown
                    onChange={onMenuItemClick}
                    items={[
                        {
                            title: t('Create goal'),
                            event: ModalEvent.GoalCreateModal,
                        },
                        {
                            title: t('Create project'),
                            event: ModalEvent.ProjectCreateModal,
                        },
                        {
                            title: t('Create team'),
                            event: ModalEvent.TeamCreateModal,
                        },
                    ]}
                    renderTrigger={(props) => (
                        <Button
                            view="primary"
                            outline
                            brick="left"
                            iconRight={
                                <Icon size="s" noWrap type={props.visible ? 'arrowUpSmall' : 'arrowDownSmall'} />
                            }
                            ref={props.ref}
                            onClick={props.onClick}
                        />
                    )}
                    renderItem={(props) => (
                        <MenuItem
                            key={props.item.title}
                            focused={props.cursor === props.index}
                            onClick={props.onClick}
                            view="primary"
                            ghost
                        >
                            {props.item.title}
                        </MenuItem>
                    )}
                />
            </StyledCreateButton>
            <HeaderMenu />
        </StyledHeader>
    );
};
