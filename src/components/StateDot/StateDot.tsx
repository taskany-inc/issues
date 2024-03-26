import React from 'react';
import { StateDot as StateDotBricks, StateDotProps, nullable } from '@taskany/bricks';
import { IconTargetOutline } from '@taskany/icons';

import { StateWrapper } from '../StateWrapper/StateWrapper';

import s from './StateDot.module.css';

export const StateDot: React.FC<
    Omit<StateDotProps & { hue?: number; view?: 'solid' | 'stroke' }, 'hoverColor' | 'color'>
> = React.memo(({ hue = 1, view = 'solid', ...props }) => {
    return (
        <StateWrapper hue={hue}>
            {nullable(
                view === 'solid',
                () => (
                    <StateDotBricks className={s.StateDot} {...props} />
                ),
                <IconTargetOutline className={s.StateIcon} size="s" {...props} />,
            )}
        </StateWrapper>
    );
});
