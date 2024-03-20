import React, { useCallback } from 'react';
import { Button } from '@taskany/bricks/harmony';
import { BaseIcon, IconMoodTongueOutline } from '@taskany/icons';

interface ReactionsButtonProps {
    emoji?: string;
    count?: number;

    onClick?: (emoji?: string) => void;
}

export const ReactionsButton = React.memo(
    React.forwardRef<HTMLButtonElement, ReactionsButtonProps>(({ emoji, count, onClick }, ref) => {
        const onButtonClick = useCallback(
            (emoji?: string) => () => {
                onClick && onClick(emoji);
            },
            [onClick],
        );

        return (
            <Button
                ref={ref}
                text={count && count > 1 ? String(count) : undefined}
                iconLeft={emoji ? <BaseIcon size="s" value={() => emoji} /> : <IconMoodTongueOutline size="xs" />}
                onClick={onButtonClick(emoji)}
            />
        );
    }),
);
