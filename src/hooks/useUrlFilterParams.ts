import { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { FiltersControlRef, FiltersState } from '@taskany/bricks';
import { ParsedUrlQuery } from 'querystring';

import { TagFilterId, filtersFields } from '../components/Filters/Filters';
import { Filter, Tag } from '../../graphql/@generated/genql';

// Order FecherArgs:
//
// [
//     priority,
//     state,
//     tags,
//     estimates,
//     owner,
//     projects,
//     query,
//     limit
// ]

type FecherArgs = [string[], string[], string[], string[], string[], string[], string, number | undefined];

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

export const buildFetcherArgs = (query: ParsedUrlQuery): FecherArgs => [
    parseQueryParam(query.priority?.toString()),
    parseQueryParam(query.state?.toString()),
    parseQueryParam(query.tags?.toString()),
    parseQueryParam(query.estimates?.toString()),
    parseQueryParam(query.user?.toString()),
    parseQueryParam(query.projects?.toString()),
    parseQueryParam(query.search?.toString()).toString(),
    query.limit ? Number(query.limit) : undefined,
];

export const buildQueryString = (state: FiltersState): string => {
    const urlParams = filtersFields.reduce((acum, filterId) => {
        const filter = state[filterId];

        if (filter && filter.value.length) {
            acum.set(filterId, filter.value.toString());
        } else {
            acum.delete(filterId);
        }

        return acum;
    }, new URLSearchParams());

    return urlParams.toString();
};

type FilterId = string;
type FilterValueId = string;
type FilterValue = [FilterId, FilterValueId[]];

export const buildFilterValues = (query: ParsedUrlQuery): FilterValue[] => {
    return filtersFields.reduce((acum, filterId) => {
        acum.push([filterId, parseQueryParam(query[filterId]?.toString())]);

        return acum;
    }, [] as FilterValue[]);
};

export const useUrlFilterParams = ({ preset }: { preset?: Filter }) => {
    const { push, asPath, query: routerQuery } = useRouter();
    const [baseUrl, queryString] = asPath.split('?');

    const [currentPreset, setCurrentPreset] = useState(preset);
    const [prevPreset, setPrevPreset] = useState(preset);

    if (prevPreset?.id !== preset?.id || prevPreset?._isStarred !== preset?._isStarred) {
        setPrevPreset(preset);
        setCurrentPreset(preset);
    }

    const query = useMemo(
        () => (currentPreset ? Object.fromEntries(new URLSearchParams(currentPreset.params)) : routerQuery),
        [currentPreset, routerQuery],
    );

    const fetchArgs = useMemo(() => buildFetcherArgs(query), [query]);

    const pushFilterState = useCallback(
        (state: FiltersState) => {
            const query = buildQueryString(state);

            push(query.length ? `${baseUrl}?${query}` : baseUrl);

            return query;
        },
        [baseUrl, push],
    );

    const setPreset = useCallback(
        (filter: string | undefined) => {
            push({
                pathname: baseUrl,
                query: {
                    filter,
                },
            });
        },
        [push, baseUrl],
    );

    return useMemo(
        () => ({
            query,
            queryString,
            currentPreset,
            pushFilterState,
            setPreset,
            fetchArgs,
        }),
        [query, queryString, pushFilterState, setPreset, currentPreset, fetchArgs],
    );
};

export const useFilterControls = (query: ParsedUrlQuery) => {
    const ref = useRef<FiltersControlRef>(null);

    useEffect(() => {
        ref.current?.setFilterValues(buildFilterValues(query));
    }, [query]);

    const setTagsFilterOutside = useCallback(
        (t: Tag): MouseEventHandler<HTMLDivElement> =>
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (ref.current) {
                    const newTagsFilterValue = new Set(ref.current.getFilterValue(TagFilterId));

                    newTagsFilterValue.has(t.id) ? newTagsFilterValue.delete(t.id) : newTagsFilterValue.add(t.id);

                    ref.current.setFilterValues([[TagFilterId, Array.from(newTagsFilterValue)]], false);
                }
            },
        [],
    );

    return {
        ref,
        setTagsFilterOutside,
    };
};
