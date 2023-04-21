import { useMemo } from 'react';
import styled from 'styled-components';
import { Text } from '@taskany/bricks';
import { gapM, gray7 } from '@taskany/colors';

import { QueryState } from '../../hooks/useUrlFilterParams';
import { EstimateFilterDropdown } from '../EstimateFilterDropdown';
import { PriorityFilterDropdown } from '../PriorityFilterDropdown';
import { ProjectFilterDropdown } from '../ProjectFilterDropdown';
import { StateFilterDropdown } from '../StateFilterDropdown';
import { TagsFilterDropdown } from '../TagsFilterDropdown';
import { UserFilterDropdown } from '../UserFilterDropdown';
import { trPriority } from '../../i18n/priority';

import { tr } from './FiltersPanelApplied.i18n';

interface FiltersPanelAppliedProps {
    queryState: QueryState;
    priority?: React.ComponentProps<typeof PriorityFilterDropdown>['priority'];
    states?: React.ComponentProps<typeof StateFilterDropdown>['states'];
    users?: React.ComponentProps<typeof UserFilterDropdown>['activity'];
    projects?: React.ComponentProps<typeof ProjectFilterDropdown>['projects'];
    tags?: React.ComponentProps<typeof TagsFilterDropdown>['tags'];
    estimates?: React.ComponentProps<typeof EstimateFilterDropdown>['estimates'];
}

const StyledApplied = styled(Text)`
    display: block;

    margin-top: -10px;
    padding: 0 40px ${gapM} 45px;
`;

const arrToMap = <T extends Array<{ id: string }>>(arr: T): { [key: string]: T[number] } =>
    arr.reduce(
        (res, curr) => ({
            ...res,
            [curr.id]: curr,
        }),
        {},
    );

export const FiltersPanelApplied: React.FC<FiltersPanelAppliedProps> = ({
    queryState,
    priority,
    states,
    users,
    projects,
    tags,
    estimates,
}) => {
    let infoString = '';

    // TODO: https://github.com/taskany-inc/issues/issues/805
    // NB: it is reason why optional chaining in maps below.

    const { statesMap, ownersMap, projectsMap, tagsMap } = useMemo(() => {
        return {
            statesMap: arrToMap(states || []),
            ownersMap: arrToMap(users || []),
            projectsMap: arrToMap(projects || []),
            tagsMap: arrToMap(tags || []),
        };
    }, [states, users, projects, tags]);

    if (queryState.priorityFilter.length && priority?.length) {
        infoString += `${tr('Priority')}: ${queryState.priorityFilter.map((p) => trPriority(p)).join(', ')}. `;
    }

    if (queryState.stateFilter.length && states?.length) {
        infoString += `${tr('State')}: ${queryState.stateFilter.map((s) => statesMap[s]?.title).join(', ')}. `;
    }

    if (queryState.ownerFilter.length && users?.length) {
        infoString += `${tr('Owner')}: ${queryState.ownerFilter.map((u) => ownersMap[u]?.user?.name).join(', ')}. `;
    }

    if (queryState.projectFilter.length && projects?.length) {
        infoString += `${tr('Project')}: ${queryState.projectFilter.map((p) => projectsMap[p]?.title).join(', ')}. `;
    }

    if (queryState.tagsFilter.length && tags?.length) {
        infoString += `${tr('Tag')}: ${queryState.tagsFilter.map((t) => tagsMap[t]?.title).join(', ')}. `;
    }

    if (queryState.estimateFilter.length && estimates?.length) {
        infoString += `${tr('Estimate')}: ${queryState.estimateFilter.join(', ')}. `;
    }

    return (
        <StyledApplied size="s" weight="bold" color={gray7}>
            {infoString}
        </StyledApplied>
    );
};
