import React, { useMemo } from 'react';
import styled from 'styled-components';
import dynamic from 'next/dynamic';

import { Reaction } from '../../graphql/@generated/genql';
import { nullable } from '../utils/nullable';

import { ReactionsButton } from './ReactionsButton';

const ReactionsDropdown = dynamic(() => import('./ReactionsDropdown'));

interface ReactionsProps {
    reactions?: Array<Reaction | undefined>;
    onClick?: React.ComponentProps<typeof ReactionsButton>['onClick'];
}

const StyledReactions = styled.div`
    display: flex;
    align-items: center;
    justify-items: center;
`;

type ReactionsMap = Record<string, { count: number; authors: Set<string> }>;

// eslint-disable-next-line react/display-name
export const Reactions = React.memo(({ reactions, onClick }: ReactionsProps) => {
    const grouppedReactions = useMemo(
        () =>
            reactions?.reduce((acc, curr) => {
                if (!curr) return acc;

                acc[curr.emoji] = acc[curr.emoji]
                    ? {
                          count: acc[curr.emoji].count + 1,
                          authors: acc[curr.emoji].authors.add(curr.activityId),
                      }
                    : {
                          count: 1,
                          authors: new Set(),
                      };

                return acc;
            }, {} as ReactionsMap),
        [reactions],
    );

    const existingReactions = nullable(grouppedReactions, (gr) =>
        Object.keys(gr).map((r) =>
            nullable(r, (reaction) => (
                <ReactionsButton key={reaction} emoji={reaction} count={gr[reaction].count} onClick={onClick} />
            )),
        ),
    );

    return (
        <StyledReactions>
            {existingReactions}

            <ReactionsDropdown onClick={onClick} />
        </StyledReactions>
    );
});
