import React from 'react';
import { Badge } from '@taskany/bricks';
import { IconStarOutline, IconStarSolid } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

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
    const onClick = () => {
        onToggle(stargizer);
    };

    return (
        <Button
            text={stargizer ? tr('Starred') : tr('Stars')}
            iconLeft={<Icon filled={!!stargizer} />}
            iconRight={count !== undefined ? <Badge>{count}</Badge> : undefined}
            onClick={onClick}
        />
    );
};
