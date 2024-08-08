import React, { MouseEvent, useCallback } from 'react';
import { nullable } from '@taskany/bricks';
import { IconStarOutline, IconStarSolid } from '@taskany/icons';
import { Button, Counter } from '@taskany/bricks/harmony';

import { tr } from './StarButton.i18n';

interface StarButtonProps {
    stargizer?: boolean;
    count?: number;

    onToggle: (val: StarButtonProps['stargizer']) => void;
}

interface IconProps {
    filled: boolean;
}

export const Icon: React.FC<IconProps> = ({ filled }) => {
    const Comp = filled ? IconStarSolid : IconStarOutline;

    return <Comp size="s" />;
};

export const StarButton: React.FC<StarButtonProps> = ({ stargizer, count, onToggle }) => {
    const onClick = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();

            onToggle(stargizer);
        },
        [onToggle, stargizer],
    );

    return (
        <Button
            text={stargizer ? tr('Starred') : tr('Stars')}
            iconLeft={<Icon filled={!!stargizer} />}
            iconRight={nullable(String(count), (c) => (
                <Counter count={Number(c)} />
            ))}
            onClick={onClick}
        />
    );
};
