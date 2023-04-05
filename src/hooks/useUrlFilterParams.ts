import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { MouseEventHandler, useCallback, useEffect, useState } from 'react';

import { Tag } from '../../graphql/@generated/genql';

const parseQueryParam = (param = '') => param.split(',').filter(Boolean);

export const parseFilterValues = (query: ParsedUrlQuery) => [
    parseQueryParam(query.priority?.toString()),
    parseQueryParam(query.state?.toString()),
    parseQueryParam(query.tags?.toString()),
    parseQueryParam(query.estimates?.toString()),
    parseQueryParam(query.user?.toString()),
    parseQueryParam(query.projects?.toString()).map((p) => Number(p)),
    parseQueryParam(query.search?.toString()).toString(),
    Number(query.limit),
];

export const useUrlFilterParams = () => {
    const router = useRouter();

    const [priorityFilter, setPriorityFilter] = useState<string[]>(parseQueryParam(router.query.priority?.toString()));
    const [stateFilter, setStateFilter] = useState<string[]>(parseQueryParam(router.query.state?.toString()));
    const [tagsFilter, setTagsFilter] = useState<string[]>(parseQueryParam(router.query.tags?.toString()));
    const [estimateFilter, setEstimateFilter] = useState<string[]>(parseQueryParam(router.query.estimates?.toString()));
    const [ownerFilter, setOwnerFilter] = useState<string[]>(parseQueryParam(router.query.user?.toString()));
    const [projectFilter, setProjectFilter] = useState<string[]>(parseQueryParam(router.query.projects?.toString()));
    const [fulltextFilter, setFulltextFilter] = useState<string>(
        parseQueryParam(router.query.search?.toString()).toString(),
    );
    const [limitFilter, setLimitFilter] = useState(Number(router.query.limit));

    const [filterValues, setFilterValues] = useState<
        [string[], string[], string[], string[], string[], string[], string, number]
    >([
        priorityFilter,
        stateFilter,
        tagsFilter,
        estimateFilter,
        ownerFilter,
        projectFilter,
        fulltextFilter,
        limitFilter,
    ]);

    useEffect(() => {
        setFilterValues([
            priorityFilter,
            stateFilter,
            tagsFilter,
            estimateFilter,
            ownerFilter,
            projectFilter,
            fulltextFilter,
            limitFilter,
        ]);
    }, [
        priorityFilter,
        stateFilter,
        tagsFilter,
        estimateFilter,
        ownerFilter,
        projectFilter,
        fulltextFilter,
        limitFilter,
    ]);

    const setTagsFilterOutside = useCallback(
        (t: Tag): MouseEventHandler<HTMLDivElement> =>
            (e) => {
                e.preventDefault();
                e.stopPropagation();

                const [
                    priorityFilter,
                    stateFilter,
                    tagsFilter,
                    estimateFilter,
                    ownerFilter,
                    projectFilter,
                    searchFilter,
                    limitFilter,
                ] = filterValues;

                const newTagsFilterValue = new Set(tagsFilter);

                newTagsFilterValue.has(t.id) ? newTagsFilterValue.delete(t.id) : newTagsFilterValue.add(t.id);

                const newSelected = Array.from(newTagsFilterValue);

                setTagsFilter(newSelected);
                setFilterValues([
                    priorityFilter,
                    stateFilter,
                    newSelected,
                    estimateFilter,
                    ownerFilter,
                    projectFilter,
                    searchFilter,
                    limitFilter,
                ]);
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
            estimateFilter.length > 0 ||
            ownerFilter.length > 0 ||
            projectFilter.length > 0 ||
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

            estimateFilter.length > 0
                ? urlParams.set('estimates', Array.from(estimateFilter).toString())
                : urlParams.delete('tags');

            ownerFilter.length > 0
                ? urlParams.set('user', Array.from(ownerFilter).toString())
                : urlParams.delete('user');

            projectFilter.length > 0
                ? urlParams.set('projects', Array.from(projectFilter).toString())
                : urlParams.delete('projects');

            fulltextFilter.length > 0 ? urlParams.set('search', fulltextFilter.toString()) : urlParams.delete('search');

            limitFilter ? urlParams.set('limit', limitFilter.toString()) : urlParams.delete('limit');

            window.history.replaceState({}, '', `${newurl}?${urlParams}`);
        }
    }, [
        priorityFilter,
        stateFilter,
        ownerFilter,
        projectFilter,
        tagsFilter,
        estimateFilter,
        limitFilter,
        fulltextFilter,
        router.query,
    ]);

    return {
        filterValues,
        setPriorityFilter,
        setStateFilter,
        setTagsFilter,
        setTagsFilterOutside,
        setEstimateFilter,
        setOwnerFilter,
        setProjectFilter,
        setFulltextFilter,
        setLimitFilter,
    };
};
