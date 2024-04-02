import { ComponentProps, FC } from 'react';
import { State as StateBricks } from '@taskany/bricks/harmony';

import { usePageContext } from '../hooks/usePageContext';
import { State as StateType } from '../../trpc/inferredTypes';

interface StateProps extends Omit<ComponentProps<typeof StateBricks>, 'color' | 'title'> {
    state: StateType;
}

export const State: FC<StateProps> = ({ state, ...props }) => {
    const { theme } = usePageContext();

    return <StateBricks color={state[`${theme}Foreground`] || undefined} title={state.title} {...props} />;
};
