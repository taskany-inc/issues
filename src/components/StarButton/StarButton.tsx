import React from 'react';
import { Badge, Button, StarFilledIcon, StarIcon } from '@taskany/bricks';

import { tr } from './StarButton.i18n';

interface StarButtonProps {
    stargizer?: boolean;
    count?: number;

    onToggle: () => void;
}

interface IconProps {
    filled: boolean;
}

const Icon: React.FC<IconProps> = ({ filled }) => {
    const Comp = filled ? StarFilledIcon : StarIcon;

    return <Comp size="s" />;
};

export const StarButton: React.FC<StarButtonProps> = ({ stargizer, count, onToggle }) => (
    <Button
        text={stargizer ? tr('Starred') : tr('Stars')}
        iconLeft={<Icon filled={!!stargizer} />}
        iconRight={count !== undefined ? <Badge>{count}</Badge> : undefined}
        onClick={onToggle}
    />
);
