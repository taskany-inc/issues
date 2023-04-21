import React from 'react';
import { Button, EyeClosedIcon, EyeIcon } from '@taskany/bricks';

import { tr } from './WatchButton.i18n';

interface WatchButtonProps {
    watcher?: boolean;

    onToggle: () => void;
}

interface IconProps {
    watching: boolean;
}

const Icon: React.FC<IconProps> = ({ watching }) => {
    const Comp = watching ? EyeIcon : EyeClosedIcon;

    return <Comp size="s" noWrap />;
};

export const WatchButton: React.FC<WatchButtonProps> = ({ watcher, onToggle }) => {
    return (
        <Button
            text={watcher ? tr('Watching') : tr('Watch')}
            iconLeft={<Icon watching={!!watcher} />}
            onClick={onToggle}
        />
    );
};
