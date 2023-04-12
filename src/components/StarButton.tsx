import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge, Button, StarFilledIcon, StarIcon } from '@taskany/bricks';

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
            iconLeft={stargizer ? <StarFilledIcon size="s" noWrap /> : <StarIcon size="s" noWrap />}
            iconRight={count !== undefined ? <Badge>{count}</Badge> : undefined}
            onClick={onToggle}
        />
    );
};
