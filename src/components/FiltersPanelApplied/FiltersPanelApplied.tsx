import { useMemo } from 'react';
import { FiltersApplied } from '@taskany/bricks';
import { gray7 } from '@taskany/colors';

import { QueryState } from '../../hooks/useUrlFilterParams';
import { getPriorityText } from '../PriorityText/PriorityText';
import { StateFilter } from '../StateFilter';
import { UserFilter } from '../UserFilter/UserFilter';
import { ProjectFilter } from '../ProjectFilter';
import { TagFilter } from '../TagFilter';
import { EstimateFilter } from '../EstimateFilter';
import { SortableProps, sortFilterTr } from '../SortFilter/SortFilter';
import { decodeEstimateFilterValue, estimateToString } from '../../utils/estimateToString';

import { tr } from './FiltersPanelApplied.i18n';

interface FiltersPanelAppliedProps {
    queryState: QueryState;
    states?: React.ComponentProps<typeof StateFilter>['states'];
    issuers?: React.ComponentProps<typeof UserFilter>['users'];
    owners?: React.ComponentProps<typeof UserFilter>['users'];
    participants?: React.ComponentProps<typeof UserFilter>['users'];
    projects?: React.ComponentProps<typeof ProjectFilter>['projects'];
    tags?: React.ComponentProps<typeof TagFilter>['tags'];
    estimates?: React.ComponentProps<typeof EstimateFilter>['estimates'];
}

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
    states,
    issuers,
    owners,
    participants,
    projects,
    tags,
    estimates,
}) => {
    let infoString = '';

    const { statesMap, issuersMap, ownersMap, participantsMap, projectsMap, tagsMap } = useMemo(() => {
        return {
            statesMap: arrToMap(states || []),
            issuersMap: arrToMap(issuers || []),
            ownersMap: arrToMap(owners || []),
            participantsMap: arrToMap(participants || []),
            projectsMap: arrToMap(projects || []),
            tagsMap: arrToMap(tags || []),
        };
    }, [states, issuers, owners, participants, projects, tags]);

    const appliedMap: Record<string, string[]> = {};

    if (queryState.priority.length) {
        appliedMap[tr('Priority')] = queryState.priority.map((p) => getPriorityText(p)).filter(Boolean);
    }

    if (queryState.state.length && states?.length) {
        appliedMap[tr('State')] = queryState.state.map((s) => statesMap[s]?.title).filter(Boolean);
    }

    if (queryState.stateType.length && states?.length) {
        appliedMap[tr('State')] = states.reduce((acum, { type, title }) => {
            if (queryState.stateType.includes(type) && !acum.includes(title)) {
                acum.push(title);
            }
            return acum;
        }, appliedMap[tr('State')] || []);
    }

    if (queryState.issuer.length && issuers?.length) {
        appliedMap[tr('Issuer')] = queryState.issuer.map((u) => issuersMap[u]?.user?.name).filter(Boolean) as string[];
    }

    if (queryState.owner.length && owners?.length) {
        appliedMap[tr('Owner')] = queryState.owner.map((u) => ownersMap[u]?.user?.name).filter(Boolean) as string[];
    }

    if (queryState.participant.length && participants?.length) {
        appliedMap[tr('Participant')] = queryState.participant
            .map((u) => participantsMap[u]?.user?.name)
            .filter(Boolean) as string[];
    }

    if (queryState.project.length && projects?.length) {
        appliedMap[tr('Project')] = queryState.project.map((p) => projectsMap[p]?.title).filter(Boolean);
    }

    if (queryState.tag.length && tags?.length) {
        appliedMap[tr('Tag')] = queryState.tag.map((t) => tagsMap[t]?.title).filter(Boolean);
    }

    if (queryState.estimate.length && estimates?.length) {
        appliedMap[tr('Estimate')] = queryState.estimate
            .map((e) => {
                const estimate = decodeEstimateFilterValue(e);

                return estimate ? estimateToString(estimate) : null;
            })
            .filter(Boolean);
    }

    Object.entries(appliedMap).forEach(([k, v]) => {
        if (v.length) infoString += `${k}: ${v.join(', ')}. `;
    });

    if (Object.keys(queryState.sort).length) {
        infoString += `${tr('Sorted')}: `;
        const items = Object.entries(queryState.sort);

        items.forEach(([k, v], i) => {
            const delimeter = items.length - 1 === i ? '.' : ', ';
            if (v.length) infoString += `${sortFilterTr(k as SortableProps)}(${v})${delimeter}`;
        });
    }

    return (
        <FiltersApplied size="s" weight="bold" color={gray7}>
            {infoString}
        </FiltersApplied>
    );
};
