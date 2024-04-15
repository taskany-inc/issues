import React, { ComponentProps } from 'react';
import { nullable } from '@taskany/bricks';
import { Dot } from '@taskany/bricks/harmony';
import { IconTargetOutline } from '@taskany/icons';

import { usePageContext } from '../../hooks/usePageContext';
import { State as StateType } from '../../../trpc/inferredTypes';

interface StateProps extends ComponentProps<typeof Dot> {
    state: StateType;
    view?: 'solid' | 'stroke';
}

export const StateDot: React.FC<StateProps> = React.memo(({ state, view = 'solid', ...props }) => {
    const { theme } = usePageContext();

    const color = state[`${theme}Foreground`] || undefined;

    return nullable(
        view === 'solid',
        () => <Dot color={color} {...props} />,
        <IconTargetOutline style={{ color }} size="s" {...props} />,
    );
});
