import { parseFilterValues } from '../hooks/useUrlFilterParams';

import { SSRProps } from './declareSsrProps';

export const filtersTakeCount = 5;

export const filtersPanelSsrInit = async ({ query, ssrHelpers }: SSRProps) => {
    const { owner, participant, issuer, project, tag } = parseFilterValues(query);

    await Promise.all([
        ssrHelpers.user.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: owner,
        }),
        ssrHelpers.user.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: participant,
        }),
        ssrHelpers.user.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: issuer,
        }),
        ssrHelpers.project.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: project,
        }),
        ssrHelpers.tag.suggestions.fetch({
            take: filtersTakeCount,
            query: '',
            include: tag,
        }),
        ssrHelpers.state.all.fetch(),
        ssrHelpers.estimates.all.fetch(),
    ]);
};
