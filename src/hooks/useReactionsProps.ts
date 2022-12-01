import { useMemo } from 'react';

import { Reaction } from '../../graphql/@generated/genql';
import { reactionsGroupsLimit, ReactionsMap } from '../components/Reactions';

export const useReactionsProps = (r?: Array<Reaction | undefined>) => {
    const reactions = useMemo(
        () =>
            r?.reduce((acc, curr) => {
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
        [r],
    );

    const reactionsNames = Object.keys(reactions || {});

    const limited = reactionsNames.length >= reactionsGroupsLimit;

    return { reactions, limited };
};
