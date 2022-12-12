import React from 'react';
import styled from 'styled-components';

import { nullable } from '../utils/nullable';

import { ReactionsButton } from './ReactionsButton';

type ReactionsMap = Record<string, { count: number; authors: Set<string> }>;

interface ReactionsProps {
    reactions?: ReactionsMap;
    children?: React.ReactNode;

    onClick?: React.ComponentProps<typeof ReactionsButton>['onClick'];
}

const StyledReactions = styled.div`
    display: flex;
    align-items: center;
    justify-items: center;
`;

// eslint-disable-next-line react/display-name
export const Reactions = React.memo(({ reactions, children, onClick }: ReactionsProps) => {
    const existingReactions = nullable(reactions, (gr) =>
        Object.keys(reactions || {}).map((r) =>
            nullable(r, (reaction) => (
                <ReactionsButton key={reaction} emoji={reaction} count={gr[reaction].count} onClick={onClick} />
            )),
        ),
    );

    return (
        <StyledReactions>
            {existingReactions}

            {children}
        </StyledReactions>
    );
});
