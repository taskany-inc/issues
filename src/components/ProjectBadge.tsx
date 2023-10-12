import React from 'react';
import NextLink from 'next/link';
import { IconUsersOutline } from '@taskany/icons';
import { Link } from '@taskany/bricks';

import { Badge } from './Badge';

interface ProjectBadgeProps {
    title: string;
    children?: React.ReactNode;
    className?: string;
}

export const ProjectBadge: React.FC<ProjectBadgeProps> = ({ title, children, className }) => {
    return (
        <Badge
            className={className}
            icon={<IconUsersOutline size="s" />}
            text={
                <Link as={NextLink} href="/" inline>
                    {title}
                </Link>
            }
            action={children}
        />
    );
};
