import React from 'react';
import { nullable } from '@taskany/bricks';
import { Tooltip } from '@taskany/bricks/harmony';

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
                        <Tooltip
                            key={reaction}
                            target={<ReactionsButton emoji={reaction} count={count} onClick={onClick} />}
                            offset={[0, 8]}
                            maxWidth={300}
                            placement="top"
                        >
                            {authors.map(({ name }) => name).join(', ')}
                            {nullable(remains, (count) => tr.raw('and {count} more', { count }))}
                        </Tooltip>
                    );
                }),
            )}

            {children}
        </div>
    );
});
