import React from 'react';
import { IconUsersOutline } from '@taskany/icons';
import { Link } from '@taskany/bricks';

import { routes } from '../hooks/router';

import { Badge } from './Badge/Badge';
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
                <Link as={NextLink} href={routes.project(id)} inline>
                    {title}
                </Link>
            }
            action={children}
        />
    );
};
