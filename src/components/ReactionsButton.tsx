import React, { useCallback } from 'react';
import styled from 'styled-components';
import { gapXs } from '@taskany/colors';
import { Button } from '@taskany/bricks';

import { Icon, sizesMap } from './Icon';

interface ReactionsButtonProps {
    emoji?: string;
    count?: number;

    onClick?: (emoji?: string) => void;
}

const StyledButton = styled(Button)`
    margin-right: ${gapXs};
`;

const StyledEmoji = styled.span`
    font-size: ${sizesMap.s}px;
`;

// eslint-disable-next-line react/display-name
export const ReactionsButton = React.memo(
    React.forwardRef<HTMLButtonElement, ReactionsButtonProps>(({ emoji, count, onClick }, ref) => {
        const onButtonClick = useCallback(
            (emoji?: string) => () => {
                onClick && onClick(emoji);
            },
            [onClick],
        );

        return (
            <StyledButton
                ref={ref}
                text={count && count > 1 ? String(count) : undefined}
                iconLeft={
                    emoji ? (
                        <StyledEmoji dangerouslySetInnerHTML={{ __html: emoji }} />
                    ) : (
                        <Icon noWrap type="emoji" size="xs" />
                    )
                }
                onClick={onButtonClick(emoji)}
            />
        );
    }),
);
