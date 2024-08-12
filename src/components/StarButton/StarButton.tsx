import React, { MouseEvent, useCallback, useState } from 'react';
import { nullable } from '@taskany/bricks';
import { IconStarOutline, IconStarSolid } from '@taskany/icons';
import { Button, Counter } from '@taskany/bricks/harmony';

import { tr } from './StarButton.i18n';

interface StarButtonProps {
    stargizer?: boolean;
    count?: number;

    onToggle: (val: StarButtonProps['stargizer']) => void;
    view?: 'default' | 'icons';
}

interface IconProps {
    filled: boolean;
}

const Icon: React.FC<IconProps> = ({ filled }) => {
    const Comp = filled ? IconStarSolid : IconStarOutline;

    return <Comp size="s" />;
};

export const StarButton: React.FC<StarButtonProps> = ({ stargizer, count, onToggle, view = 'default' }) => {
    const [isStargizer, setIsStargizer] = useState(!!stargizer);
    const onClick = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();

            onToggle(isStargizer);
            setIsStargizer((prev) => !prev);
        },
        [onToggle, isStargizer],
    );

    if (view === 'icons') {
        return <Button view="clear" iconLeft={<Icon filled={isStargizer} />} onClick={onClick} />;
    }

    return (
        <Button
            text={isStargizer ? tr('Starred') : tr('Stars')}
            iconLeft={<Icon filled={isStargizer} />}
            iconRight={nullable(String(count), (c) => (
                <Counter count={Number(c)} />
            ))}
            onClick={onClick}
        />
    );
};
