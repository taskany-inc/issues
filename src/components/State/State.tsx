import React from 'react';
import dynamic from 'next/dynamic';
import cn from 'classnames';

import s from './State.module.css';

const StateWrapper = dynamic(() => import('../StateWrapper/StateWrapper'));

interface StateProps {
    title: string;
    hue?: number;
    size?: 's' | 'm';
    onClick?: () => void;
}

export const State = React.forwardRef<HTMLDivElement, StateProps>(({ title, hue = 1, size = 'm', onClick }, ref) => {
    return (
        <StateWrapper hue={hue}>
            <div
                className={cn(s.State, { [s.State_size_s]: size === 's' }, { [s.State_interactive]: Boolean(onClick) })}
                ref={ref}
                onClick={onClick}
            >
                {title}
            </div>
        </StateWrapper>
    );
});
