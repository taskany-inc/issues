import { useMemo } from 'react';
import { FiltersApplied } from '@taskany/bricks';

import { QueryState } from '../../hooks/useUrlFilterParams';
import { getPriorityText } from '../PriorityText/PriorityText';
import { StateFilter } from '../StateFilter';
import { UserFilter } from '../UserFilter/UserFilter';
import { ProjectFilter } from '../ProjectFilter';
import { decodeEstimateFromUrl, getEstimateLabel } from '../EstimateFilter';
import { TagFilter } from '../TagFilter';
import { SortableProps, sortFilterTr } from '../SortFilter/SortFilter';
import { useLocale } from '../../hooks/useLocale';

import { tr } from './FiltersPanelApplied.i18n';
import s from './FiltersPanelApplied.module.css';

interface FiltersPanelAppliedProps {
    queryState?: QueryState;
    states?: React.ComponentProps<typeof StateFilter>['states'];
    issuers?: React.ComponentProps<typeof UserFilter>['users'];
    owners?: React.ComponentProps<typeof UserFilter>['users'];
    participants?: React.ComponentProps<typeof UserFilter>['users'];
    projects?: React.ComponentProps<typeof ProjectFilter>['projects'];
    tags?: React.ComponentProps<typeof TagFilter>['tags'];
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
}) => {
    let infoString = '';
    const locale = useLocale();
    const {
        priority = [],
        state = [],
        stateType = [],
        issuer = [],
        owner = [],
        participant = [],
        project = [],
        tag = [],
        estimate = [],
        sort = {},
    } = queryState || {};

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

    if (priority.length) {
        appliedMap[tr('Priority')] = priority.map((p) => getPriorityText(p)).filter(Boolean);
    }

    if (state.length && states?.length) {
        appliedMap[tr('State')] = state.map((s) => statesMap[s]?.title).filter(Boolean);
    }

    if (stateType.length && states?.length) {
        appliedMap[tr('State')] = states.reduce((acum, { type, title }) => {
            if (stateType?.includes(type) && !acum.includes(title)) {
                acum.push(title);
            }
            return acum;
        }, appliedMap[tr('State')] || []);
    }

    if (issuer.length && issuers?.length) {
        appliedMap[tr('Issuer')] = issuer.map((u) => issuersMap[u]?.name).filter(Boolean) as string[];
    }

    if (owner.length && owners?.length) {
        appliedMap[tr('Owner')] = owner.map((u) => ownersMap[u]?.name).filter(Boolean) as string[];
    }

    if (participant.length && participants?.length) {
        appliedMap[tr('Participant')] = participant.map((u) => participantsMap[u]?.name).filter(Boolean) as string[];
    }

    if (project.length && projects?.length) {
        appliedMap[tr('Project')] = project.map((p) => projectsMap[p]?.title).filter(Boolean);
    }

    if (tag.length && tags?.length) {
        appliedMap[tr('Tag')] = tag.map((t) => tagsMap[t]?.title).filter(Boolean);
    }

    if (estimate.length) {
        appliedMap[tr('Estimate')] = estimate
            .map((e) => {
                const dateRange = decodeEstimateFromUrl(e);

                if (dateRange) {
                    return getEstimateLabel(dateRange, locale);
                }

                return null;
            })
            .filter(Boolean);
    }

    Object.entries(appliedMap).forEach(([k, v]) => {
        if (v.length) infoString += `${k}: ${v.join(', ')}. `;
    });

    if (Object.keys(sort).length) {
        infoString += `${tr('Sorted')}: `;
        const items = Object.entries(sort);

        items.forEach(([k, v], i) => {
            const delimeter = items.length - 1 === i ? '.' : ', ';
            if (v != null && v.length) infoString += `${sortFilterTr(k as SortableProps)}(${v})${delimeter}`;
        });
    }

    return (
        <FiltersApplied className={s.FiltersPanelApplied} size="s" weight="bold">
            {infoString}
        </FiltersApplied>
    );
};
