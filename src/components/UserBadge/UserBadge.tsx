import React, { forwardRef } from 'react';
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
    as?: React.ComponentProps<typeof User>['as'];
    className?: string;
}

export const UserBadge = forwardRef<HTMLDivElement, UserBadgeProps>(
    ({ name, image, email, children, short, size = 's', as, className }, ref) => {
        return (
            <User
                ref={ref}
                className={cn(s.UserBadge, className)}
                src={image}
                email={email}
                name={name}
                short={short}
                iconRight={children}
                action="dynamic"
                size={size}
                as={as}
            />
        );
    },
);
