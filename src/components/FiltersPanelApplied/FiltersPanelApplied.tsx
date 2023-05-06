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
import { getPriorityText } from '../PriorityText/PriorityText';

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

    const appliedMap: Record<string, string[]> = {};

    if (queryState.priority.length && priority?.length) {
        appliedMap[tr('Priority')] = queryState.priority.map((p) => getPriorityText(p)).filter(Boolean);
    }

    if (queryState.state.length && states?.length) {
        appliedMap[tr('State')] = queryState.state.map((s) => statesMap[s]?.title).filter(Boolean);
    }

    if (queryState.owner.length && users?.length) {
        appliedMap[tr('Owner')] = queryState.owner.map((u) => ownersMap[u]?.user?.name).filter(Boolean) as string[];
    }

    if (queryState.project.length && projects?.length) {
        appliedMap[tr('Project')] = queryState.project.map((p) => projectsMap[p]?.title).filter(Boolean);
    }

    if (queryState.tag.length && tags?.length) {
        appliedMap[tr('Tag')] = queryState.tag.map((t) => tagsMap[t]?.title).filter(Boolean);
    }

    if (queryState.estimate.length && estimates?.length) {
        appliedMap[tr('Estimate')] = queryState.estimate.filter(Boolean);
    }

    Object.entries(appliedMap).forEach(([k, v]) => {
        if (v.length) infoString += `${k}: ${v.join(' ,')}. `;
    });

    return (
        <StyledApplied size="s" weight="bold" color={gray7}>
            {infoString}
        </StyledApplied>
    );
};
