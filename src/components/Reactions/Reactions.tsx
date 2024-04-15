import React from 'react';
import { Popup, nullable } from '@taskany/bricks';

import { ReactionsMap } from '../../types/reactions';
import { ReactionsButton } from '../ReactionsButton';

import { tr } from './Reactions.i18n';
import s from './Reactions.module.css';

interface ReactionsProps {
    reactions?: ReactionsMap;
    children?: React.ReactNode;

    onClick?: React.ComponentProps<typeof ReactionsButton>['onClick'];
}

export const Reactions = React.memo(({ reactions, children, onClick }: ReactionsProps) => {
    return (
        <div className={s.Reactions}>
            {nullable(reactions, (reactionsMap) =>
                Object.entries(reactionsMap).map(([reaction, { authors, count, remains }]) => {
                    return (
                        <Popup
                            key={reaction}
                            target={<ReactionsButton emoji={reaction} count={count} onClick={onClick} />}
                            tooltip
                            offset={[0, 8]}
                            maxWidth={300}
                            placement="top"
                        >
                            {authors.map(({ name }) => name).join(', ')}
                            {nullable(remains, (count) => tr.raw('and {count} more', { count }))}
                        </Popup>
                    );
                }),
            )}

            {children}
        </div>
    );
});
