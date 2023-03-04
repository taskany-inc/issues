import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { MouseEventHandler, useCallback, useEffect, useState } from 'react';

import { Tag } from '../../graphql/@generated/genql';

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

export const parseFilterValues = (query: ParsedUrlQuery) => [
    parseQueryParam(query.priority?.toString()),
    parseQueryParam(query.state?.toString()),
    parseQueryParam(query.tags?.toString()),
    parseQueryParam(query.user?.toString()),
    parseQueryParam(query.search?.toString()).toString(),
    Number(query.limit),
];

export const useUrlFilterParams = () => {
    const router = useRouter();

    const [priorityFilter, setPriorityFilter] = useState<string[]>(parseQueryParam(router.query.priority?.toString()));
    const [stateFilter, setStateFilter] = useState<string[]>(parseQueryParam(router.query.state?.toString()));
    const [tagsFilter, setTagsFilter] = useState<string[]>(parseQueryParam(router.query.tags?.toString()));
    const [ownerFilter, setOwnerFilter] = useState<string[]>(parseQueryParam(router.query.user?.toString()));
    const [fulltextFilter, setFulltextFilter] = useState<string>(
        parseQueryParam(router.query.search?.toString()).toString(),
    );
    const [limitFilter, setLimitFilter] = useState(Number(router.query.limit));

    const [filterValues, setFilterValues] = useState<[string[], string[], string[], string[], string, number]>([
        priorityFilter,
        stateFilter,
        tagsFilter,
        ownerFilter,
        fulltextFilter,
        limitFilter,
    ]);

    useEffect(() => {
        setFilterValues([priorityFilter, stateFilter, tagsFilter, ownerFilter, fulltextFilter, limitFilter]);
    }, [priorityFilter, stateFilter, tagsFilter, ownerFilter, fulltextFilter, limitFilter]);

    const setTagsFilterOutside = useCallback(
        (t: Tag): MouseEventHandler<HTMLDivElement> =>
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                const [priorityFilter, stateFilter, tagsFilter, ownerFilter, searchFilter, limitFilter] = filterValues;

                const newTagsFilterValue = new Set(tagsFilter);

                newTagsFilterValue.has(t.id) ? newTagsFilterValue.delete(t.id) : newTagsFilterValue.add(t.id);

                const newSelected = Array.from(newTagsFilterValue);

                setTagsFilter(newSelected);
                setFilterValues([priorityFilter, stateFilter, newSelected, ownerFilter, searchFilter, limitFilter]);
            },
        [filterValues, setTagsFilter],
    );

    useEffect(() => {
        const newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
        const urlParams = new URLSearchParams();

        if (
            priorityFilter.length > 0 ||
            stateFilter.length > 0 ||
            tagsFilter.length > 0 ||
            ownerFilter.length > 0 ||
            fulltextFilter.length > 0 ||
            limitFilter
        ) {
            priorityFilter.length > 0
                ? urlParams.set('priority', Array.from(priorityFilter).toString())
                : urlParams.delete('priority');

            stateFilter.length > 0
                ? urlParams.set('state', Array.from(stateFilter).toString())
                : urlParams.delete('state');

            tagsFilter.length > 0 ? urlParams.set('tags', Array.from(tagsFilter).toString()) : urlParams.delete('tags');

            ownerFilter.length > 0
                ? urlParams.set('user', Array.from(ownerFilter).toString())
                : urlParams.delete('user');

            fulltextFilter.length > 0 ? urlParams.set('search', fulltextFilter.toString()) : urlParams.delete('search');

            limitFilter ? urlParams.set('limit', limitFilter.toString()) : urlParams.delete('limit');

            window.history.replaceState({}, '', `${newurl}?${urlParams}`);
        }
    }, [priorityFilter, stateFilter, ownerFilter, tagsFilter, limitFilter, fulltextFilter, router.query]);

    return {
        filterValues,
        setPriorityFilter,
        setStateFilter,
        setTagsFilter,
        setTagsFilterOutside,
        setOwnerFilter,
        setFulltextFilter,
        setLimitFilter,
    };
};
