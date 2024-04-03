import React, { MouseEvent } from 'react';
import { nullable } from '@taskany/bricks';
import { IconStarOutline, IconStarSolid } from '@taskany/icons';
import { Button, Badge } from '@taskany/bricks/harmony';

import { tr } from './StarButton.i18n';

interface StarButtonProps {
    stargizer?: boolean;
    count?: number;

    onToggle: (val: StarButtonProps['stargizer']) => void;
}

interface IconProps {
    filled: boolean;
}

const Icon: React.FC<IconProps> = ({ filled }) => {
    const Comp = filled ? IconStarSolid : IconStarOutline;

    return <Comp size="s" />;
};

export const StarButton: React.FC<StarButtonProps> = ({ stargizer, count, onToggle }) => {
    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        onToggle(stargizer);
    };

    return (
        <Button
            text={stargizer ? tr('Starred') : tr('Stars')}
            iconLeft={<Icon filled={!!stargizer} />}
            iconRight={nullable(String(count), (text) => (
                <Badge view="outline" text={text} weight="thinner" />
            ))}
            onClick={onClick}
        />
    );
};
