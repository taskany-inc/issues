import { HTMLAttributes, forwardRef, useMemo } from 'react';
import cn from 'classnames';

import s from './Circle.module.css';

interface CircleProps extends HTMLAttributes<HTMLSpanElement> {
    size: number;
    backgroundColor?: string;
}

export const Circle = forwardRef<HTMLSpanElement, CircleProps>(
    ({ children, size, className, style, ...props }, ref) => {
        const styles = useMemo(
            () => ({
                width: `${size}px`,
                height: `${size}px`,
                ...style,
            }),
            [size, style],
        );
        return (
            <span className={cn(s.Circle, className)} style={styles} {...props} ref={ref}>
                {children}
            </span>
        );
    },
);
