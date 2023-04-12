import React from 'react';
import { useTranslations } from 'next-intl';
import { Button, EyeClosedIcon, EyeIcon } from '@taskany/bricks';

interface WatchButtonProps {
    watcher?: boolean;

    onToggle: () => void;
}

export const WatchButton: React.FC<WatchButtonProps> = ({ watcher, onToggle }) => {
    const t = useTranslations('WatchButton');

    return (
        <Button
            text={t(watcher ? 'Watching' : 'Watch')}
            iconLeft={watcher ? <EyeIcon noWrap size="s" /> : <EyeClosedIcon noWrap size="s" />}
            onClick={onToggle}
        />
    );
};
