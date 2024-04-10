import { HTMLAttributes, forwardRef } from 'react';
import cn from 'classnames';

import s from './ActivityFeed.module.css';

interface ActivityFeedProps extends HTMLAttributes<HTMLDivElement> {}

export const ActivityFeed = forwardRef<HTMLDivElement, ActivityFeedProps>(({ children, className, ...props }, ref) => (
    <div className={cn(s.ActivityFeed, className)} ref={ref} {...props}>
        {children}
    </div>
));

interface ActivityFeedItemProps extends HTMLAttributes<HTMLDivElement> {}

export const ActivityFeedItem = ({ children, className, ...props }: ActivityFeedItemProps) => (
    <div className={cn(s.ActivityFeedItem, className)} {...props}>
        {children}
    </div>
);
