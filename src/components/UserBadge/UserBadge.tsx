import React from 'react';
import { User } from '@taskany/bricks/harmony';
import cn from 'classnames';

import s from './UserBadge.module.css';

interface UserBadgeProps {
    name: string;
    image?: string;
    email?: string;
    children?: React.ReactNode;
    className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ name, image, email, children, className }) => {
    return (
        <User
            className={cn(s.UserBadge, className)}
            src={image}
            email={email}
            name={name}
            iconRight={children}
            action="dynamic"
        />
    );
};
