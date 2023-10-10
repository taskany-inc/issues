import React from 'react';
import { UserPic } from '@taskany/bricks';

import { Badge } from './Badge';

interface UserBadgeProps {
    name: string;
    image?: string;
    email?: string;
    children?: React.ReactNode;
    className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ name, image, email, children, className }) => {
    return (
        <Badge
            className={className}
            icon={<UserPic src={image} email={email} size={24} />}
            text={name}
            action={children}
        />
    );
};
