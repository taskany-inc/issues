import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Button } from '@taskany/bricks';

import { Icon } from './Icon';

interface StarButtonProps {
    stargizer?: boolean;
    count?: number;

    onToggle: () => void;
}

export const StarButton: React.FC<StarButtonProps> = ({ stargizer, count, onToggle }) => {
    const t = useTranslations('StarButton');

    return (
        <Button
            text={t(stargizer ? 'Starred' : 'Stars')}
            iconLeft={<Icon noWrap type={stargizer ? 'starFilled' : 'star'} size="s" />}
            iconRight={count !== undefined ? <Badge>{count}</Badge> : undefined}
            onClick={onToggle}
        />
    );
};
