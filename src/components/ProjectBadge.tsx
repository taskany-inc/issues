import React from 'react';
import { IconUsersOutline } from '@taskany/icons';

import { routes } from '../hooks/router';

import { Badge } from './Badge';
import { NextLink } from './NextLink';

interface ProjectBadgeProps {
    id: string;
    title: string;
    children?: React.ReactNode;
    className?: string;
}

export const ProjectBadge: React.FC<ProjectBadgeProps> = ({ id, title, children, className }) => {
    return (
        <Badge
            className={className}
            icon={<IconUsersOutline size="s" />}
            text={
                <NextLink href={routes.project(id)} view="inline">
                    {title}
                </NextLink>
            }
            action={children}
        />
    );
};
