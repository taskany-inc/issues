import React, { useCallback, useState, useEffect, useRef } from 'react';
import cn from 'classnames';

import { useForkedRef } from '../../hooks/useForkedRef';

import s from './ScrollableView.module.css';

export interface OverflowScrollProps {
    className?: string;
    children: React.ReactNode;
}

interface OverflowScrollState {
    left: boolean;
    right: boolean;
}

export const ScrollableView = React.forwardRef<HTMLDivElement, OverflowScrollProps>(({ className, children }, ref) => {
    const [shades, setShades] = useState<OverflowScrollState>({
        left: false,
        right: false,
    });

    const innerRef = useRef<HTMLDivElement>(null);
    const forkedRef = useForkedRef(ref, innerRef);

    const onScrollHandler = useCallback(() => {
        const el = innerRef.current;

        if (el == null) {
            return;
        }

        if (el.clientWidth >= el.scrollWidth) {
            setShades({
                left: false,
                right: false,
            });
        } else {
            setShades({
                left: el.scrollLeft > 0,
                right: el.scrollLeft + el.clientWidth < el.scrollWidth,
            });
        }
    }, []);

    useEffect(() => {
        onScrollHandler();

        window.addEventListener('resize', onScrollHandler, { capture: true });

        return () => {
            window.removeEventListener('resize', onScrollHandler, { capture: true });
        };
    }, [onScrollHandler]);

    return (
        <div className={cn(s.ScrollWrapper, s.ExtendArea, className)} onResizeCapture={onScrollHandler}>
            <span
                className={cn(s.Shade, { [s.Shade_visible]: shades.left }, s.ShadeLeft)}
                key={`left-${shades.left}`}
            />
            <span
                className={cn(s.Shade, { [s.Shade_visible]: shades.right }, s.ShadeRight)}
                key={`right-${shades.right}`}
            />

            <div className={cn(s.ScrollContainer, s.ExtendArea)} onScroll={onScrollHandler} ref={forkedRef}>
                {children}
            </div>
        </div>
    );
});
