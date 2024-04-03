import React from 'react';
import { IconUsersOutline } from '@taskany/icons';
import { Badge } from '@taskany/bricks/harmony';

import { routes } from '../hooks/router';

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
            iconLeft={<IconUsersOutline size="s" />}
            iconRight={children}
            text={
                <NextLink href={routes.project(id)} view="secondary">
                    {title}
                </NextLink>
            }
            action="dynamic"
        />
    );
};
