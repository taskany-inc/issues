import React from 'react';
import styled from 'styled-components';
import { Popup, nullable } from '@taskany/bricks';
import { gapXs } from '@taskany/colors';

import { ReactionsMap } from '../../types/reactions';
import { ReactionsButton } from '../ReactionsButton';

import { tr } from './Reactions.i18n';

interface ReactionsProps {
    reactions?: ReactionsMap;
    children?: React.ReactNode;

    onClick?: React.ComponentProps<typeof ReactionsButton>['onClick'];
}

const StyledReactions = styled.div`
    display: flex;
    gap: ${gapXs};
`;

export const Reactions = React.memo(({ reactions, children, onClick }: ReactionsProps) => {
    return (
        <StyledReactions>
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
        </StyledReactions>
    );
});
