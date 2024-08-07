import React, { MouseEvent } from 'react';
import { IconEyeOutline, IconEyeClosedSolid } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { watch } from '../../utils/domObjects';

import { tr } from './WatchButton.i18n';

interface WatchButtonProps {
    watcher?: boolean;

    onToggle: (val: WatchButtonProps['watcher']) => void;
}

interface IconProps {
    watching: boolean;
    className?: string;
}

export const Icon: React.FC<IconProps> = ({ watching, className }) => {
    const Comp = watching ? IconEyeOutline : IconEyeClosedSolid;

    return <Comp size="s" className={className} />;
};

export const WatchButton: React.FC<WatchButtonProps> = ({ watcher, onToggle }) => {
    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        onToggle(watcher);
    };

    return (
        <Button
            text={watcher ? tr('Watching') : tr('Watch')}
            iconLeft={<Icon watching={!!watcher} />}
            onClick={onClick}
            {...watch.attr}
        />
    );
};
