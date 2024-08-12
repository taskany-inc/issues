import React, { MouseEvent, useState } from 'react';
import { IconEyeOutline, IconEyeClosedSolid } from '@taskany/icons';
import { Button } from '@taskany/bricks/harmony';

import { watch } from '../../utils/domObjects';

import s from './WatchButton.module.css';
import { tr } from './WatchButton.i18n';

interface WatchButtonProps {
    watcher?: boolean;

    onToggle: (val: WatchButtonProps['watcher']) => void;
    view?: 'default' | 'icons';
}

interface IconProps {
    watching: boolean;
    className?: string;
}

const Icon: React.FC<IconProps> = ({ watching, className }) => {
    const Comp = watching ? IconEyeOutline : IconEyeClosedSolid;

    return <Comp size="s" className={className} />;
};

export const WatchButton: React.FC<WatchButtonProps> = ({ watcher, onToggle, view = 'default' }) => {
    const [isWatching, setIsWatching] = useState(!!watcher);
    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        onToggle(isWatching);
        setIsWatching((prev) => !prev);
    };

    if (view === 'icons') {
        return (
            <Button
                className={s.WatchButtonIcon}
                view="clear"
                iconLeft={<Icon watching={isWatching} />}
                onClick={onClick}
                {...watch.attr}
            />
        );
    }

    return (
        <Button
            text={isWatching ? tr('Watching') : tr('Watch')}
            iconLeft={<Icon watching={isWatching} />}
            onClick={onClick}
            {...watch.attr}
        />
    );
};
