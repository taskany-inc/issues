import React from 'react';
import { User } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './UserBadge.module.css';

interface UserBadgeProps {
    name: string;
    image?: string;
    email?: string;
    children?: React.ReactNode;
    short?: boolean;
    size?: React.ComponentProps<typeof User>['size'];
    className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ name, image, email, children, short, size = 's', className }) => {
    return (
        <User
            className={cn(s.UserBadge, className)}
            src={image}
            email={email}
            name={name}
            short={short}
            iconRight={children}
            action="dynamic"
            size={size}
        />
    );
};
