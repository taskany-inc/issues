import React from 'react';
import styled from 'styled-components';

import { Button } from './Button';
import { Icon, sizesMap } from './Icon';

interface ReactionsButtonProps {
    emoji?: string;
    count?: number;

    onClick?: React.ComponentProps<typeof Button>['onClick'];
}

const StyledEmoji = styled.span`
    font-size: ${sizesMap.s}px;
`;

// eslint-disable-next-line react/display-name
export const ReactionsButton = React.forwardRef<HTMLButtonElement, ReactionsButtonProps>(
    ({ emoji, count, onClick }, ref) => (
        <Button
            ghost
            ref={ref}
            text={count ? String(count) : undefined}
            iconLeft={emoji ? <StyledEmoji>{emoji}</StyledEmoji> : <Icon noWrap type="emoji" size="xs" />}
            onClick={onClick}
        />
    ),
);
