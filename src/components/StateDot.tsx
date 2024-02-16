import React from 'react';
import { StateDot as StateDotBricks, StateDotProps, nullable } from '@taskany/bricks';
import { IconTargetOutline } from '@taskany/icons';
import styled from 'styled-components';

import { StateWrapper, stateStrokeHover } from './StateWrapper';

const StyledDot = styled(StateDotBricks)`
    background-color: ${stateStrokeHover};
`;

const StyledIcon = styled(IconTargetOutline)`
    color: ${stateStrokeHover};
`;

// eslint-disable-next-line react/display-name
export const StateDot: React.FC<
    Omit<StateDotProps & { hue?: number; view?: 'solid' | 'stroke' }, 'hoverColor' | 'color'>
> = React.memo(({ hue = 1, view = 'solid', ...props }) => {
    return (
        <StateWrapper hue={hue}>
            {nullable(
                view === 'solid',
                () => (
                    <StyledDot {...props} />
                ),
                <StyledIcon size="s" {...props} />,
            )}
        </StateWrapper>
    );
});
