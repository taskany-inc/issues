import React from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@common/Button';

import { Icon } from './Icon';

interface WatchButtonProps {
    watcher?: boolean;

    onToggle: () => void;
}

export const WatchButton: React.FC<WatchButtonProps> = ({ watcher, onToggle }) => {
    const t = useTranslations('WatchButton');

    return (
        <Button
            text={t(watcher ? 'Watching' : 'Watch')}
            iconLeft={<Icon noWrap type={watcher ? 'eye' : 'eyeClosed'} size="s" />}
            onClick={onToggle}
        />
    );
};
