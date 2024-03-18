import { ComponentProps, FC, HTMLAttributes, ReactNode, useState } from 'react';
import NextLink from 'next/link';
import cn from 'classnames';
import { ListView, ListViewItem, nullable } from '@taskany/bricks';
import { MenuItem, TaskanyLogo, Text } from '@taskany/bricks/harmony';
import { IconDownSmallOutline, IconUpSmallOutline } from '@taskany/icons';

import s from './NavigationSidebar.module.css';

export const NavigationSidebar: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...rest }) => {
    return (
        <div className={cn(s.NavigationSidebarContainer, className)} {...rest}>
            {children}
        </div>
    );
};

export const NavigationSidebarHeader: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...rest }) => (
    <div className={cn(s.NavigationSidebarHeader, className)} {...rest}>
        {children}
    </div>
);

export const NavigationSidebarTitle: FC<ComponentProps<typeof Text>> = ({ children, className, ...rest }) => (
    <Text className={cn(s.NavigationSidebarTitle, className)} weight="bold" size="l" {...rest}>
        {children}
    </Text>
);

interface NavigationSidebarLogoProps {
    logo?: string;
    href: string;
}

export const NavigationSidebarLogo: FC<NavigationSidebarLogoProps> = ({ href, logo }) => (
    <NextLink className={s.NavigationSidebarLogo} href={href} passHref>
        <TaskanyLogo src={logo} size="m" />
    </NextLink>
);

export const NavigationSidebarContent: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...rest }) => (
    <div className={cn(s.NavigationSidebarContent, className)} {...rest}>
        {children}
    </div>
);

export const Navigation: FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...rest }) => (
    <div className={cn(s.Navigation, className)} {...rest}>
        {children}
    </div>
);

interface NavigationSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
    title: ReactNode;
    collapsed?: boolean;
}

export const NavigationSection: FC<NavigationSectionProps> = ({
    collapsed: defaultState = false,
    title,
    children,
    className,
    ...rest
}) => {
    const [collapsed, setCollapsed] = useState(defaultState);
    return (
        <div className={cn(s.NavigationSection, className)} {...rest}>
            <div className={s.NavigationSectionTitle} onClick={() => setCollapsed((val) => !val)}>
                <Text size="xs">{title}</Text>
                {nullable(
                    collapsed,
                    () => (
                        <IconUpSmallOutline size="s" />
                    ),
                    <IconDownSmallOutline size="s" />,
                )}
            </div>
            {nullable(!collapsed, () => (
                <ListView>{children}</ListView>
            ))}
        </div>
    );
};

interface NavigationItemProps extends HTMLAttributes<HTMLDivElement> {
    href: string;
    selected?: boolean;
}

export const NavigationItem: FC<NavigationItemProps> = ({ selected, href, children, ...rest }) => (
    <ListViewItem
        value={href}
        renderItem={({ hovered, active, ...props }) => (
            <NextLink href={href} legacyBehavior>
                <MenuItem hovered={active || hovered || selected} selected={active} {...props} {...rest}>
                    {children}
                </MenuItem>
            </NextLink>
        )}
    />
);
