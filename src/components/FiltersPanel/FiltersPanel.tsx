import React, { useCallback } from 'react';
import styled from 'styled-components';
import { debounce } from 'throttle-debounce';
import { gapM, gapS, gray5, gray6, gray9, textColor } from '@taskany/colors';
import { Badge, Text, Input, StarIcon, nullable, StarFilledIcon } from '@taskany/bricks';
import { Filter } from '@prisma/client';

import { FilterById } from '../../../trpc/inferredTypes';
import type { QueryState } from '../../hooks/useUrlFilterParams';
import { PageContent } from '../Page';
import { StateFilterDropdown } from '../StateFilterDropdown';
import { UserFilterDropdown } from '../UserFilterDropdown';
import { TagsFilterDropdown } from '../TagsFilterDropdown';
import { LimitFilterDropdown } from '../LimitFilterDropdown';
import { PriorityFilterDropdown } from '../PriorityFilterDropdown';
import { EstimateFilterDropdown } from '../EstimateFilterDropdown';
import { ProjectFilterDropdown } from '../ProjectFilterDropdown';
import { PresetFilterDropdown } from '../PresetFilterDropdown';
import { FiltersPanelApplied } from '../FiltersPanelApplied/FiltersPanelApplied';

import { tr } from './FiltersPanel.i18n';

interface FiltersPanelProps {
    queryState: QueryState;
    queryString?: string;
    count?: number;
    filteredCount?: number;
    priority?: React.ComponentProps<typeof PriorityFilterDropdown>['priority'];
    states?: React.ComponentProps<typeof StateFilterDropdown>['states'];
    users?: React.ComponentProps<typeof UserFilterDropdown>['activity'];
    projects?: React.ComponentProps<typeof ProjectFilterDropdown>['projects'];
    tags?: React.ComponentProps<typeof TagsFilterDropdown>['tags'];
    estimates?: React.ComponentProps<typeof EstimateFilterDropdown>['estimates'];
    presets?: Filter[];
    currentPreset?: FilterById;
    loading?: boolean;
    children?: React.ReactNode;

    onSearchChange: (search: string) => void;
    onPriorityChange?: React.ComponentProps<typeof PriorityFilterDropdown>['onChange'];
    onStateChange?: React.ComponentProps<typeof StateFilterDropdown>['onChange'];
    onUserChange?: React.ComponentProps<typeof UserFilterDropdown>['onChange'];
    onProjectChange?: React.ComponentProps<typeof ProjectFilterDropdown>['onChange'];
    onTagChange?: React.ComponentProps<typeof TagsFilterDropdown>['onChange'];
    onEstimateChange?: React.ComponentProps<typeof EstimateFilterDropdown>['onChange'];
    onLimitChange?: React.ComponentProps<typeof LimitFilterDropdown>['onChange'];
    onPresetChange?: React.ComponentProps<typeof PresetFilterDropdown>['onChange'];
    onFilterStar?: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledFiltersPanel = styled(({ loading, ...props }) => <div {...props} />)<{ loading?: boolean }>`
    margin: ${gapM} 0;
    padding: ${gapS} 0;

    background-color: ${gray5};

    animation-name: bkgChange;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;

    transition: background-color 200ms ease-in-out;

    @keyframes bkgChange {
        0% {
            background-color: ${gray5};
        }
        50.0% {
            background-color: ${gray6};
        }
        100.0% {
            background-color: ${gray5};
        }
    }

    ${({ loading }) =>
        loading &&
        `
            animation-play-state: running;
            animation-duration: 1s;
    `}
`;

const StyledFiltersContent = styled(PageContent)`
    padding-top: 0;

    display: grid;
    grid-template-columns: 2fr 9fr 1fr;
    align-items: center;
`;

const StyledFiltersMenuWrapper = styled.div`
    display: flex;
    align-items: center;

    padding-left: ${gapS};
`;

const StyledFiltersMenu = styled.div`
    padding-left: ${gapM};
`;

const StyledFiltersAction = styled.div`
    display: inline-block;
    padding-left: ${gapS};
    padding-right: ${gapS};
    vertical-align: middle;

    cursor: pointer;

    color: ${gray9};

    :hover {
        color: ${textColor};
    }

    transition: color 200ms ease-in-out;
`;

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
    queryState,
    queryString,
    count,
    filteredCount,
    states,
    priority,
    users,
    projects,
    tags,
    estimates,
    presets,
    currentPreset,
    loading,
    children,
    onPriorityChange,
    onSearchChange,
    onStateChange,
    onUserChange,
    onProjectChange,
    onTagChange,
    onEstimateChange,
    onLimitChange,
    onPresetChange,
    onFilterStar,
}) => {
    const debouncedSearchHandler = debounce(200, onSearchChange);

    const onSearchInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => debouncedSearchHandler(e.currentTarget.value),
        [debouncedSearchHandler],
    );

    return (
        <>
            <StyledFiltersPanel loading={loading}>
                <StyledFiltersContent>
                    <Input
                        placeholder={tr('Search')}
                        defaultValue={queryState.fulltextFilter}
                        onChange={onSearchInputChange}
                    />

                    <StyledFiltersMenuWrapper>
                        {nullable(count, () => (
                            <Badge size="m">
                                {filteredCount === undefined || count === filteredCount ? (
                                    count
                                ) : (
                                    <>
                                        <Text weight="bold" color={textColor} size="xs" as="span">
                                            {filteredCount}
                                        </Text>
                                        {` / ${count}`}
                                    </>
                                )}
                            </Badge>
                        ))}

                        <StyledFiltersMenu>
                            {Boolean(priority?.length) &&
                                onPriorityChange &&
                                nullable(priority, (pr) => (
                                    <PriorityFilterDropdown
                                        text={tr('Priority')}
                                        priority={pr}
                                        value={queryState.priorityFilter}
                                        onChange={onPriorityChange}
                                    />
                                ))}

                            {Boolean(states?.length) &&
                                onStateChange &&
                                nullable(states, (st) => (
                                    <StateFilterDropdown
                                        text={tr('State')}
                                        states={st}
                                        value={queryState.stateFilter}
                                        onChange={onStateChange}
                                    />
                                ))}

                            {Boolean(users?.length) &&
                                onUserChange &&
                                nullable(users, (u) => (
                                    <UserFilterDropdown
                                        text={tr('Owner')}
                                        activity={u}
                                        value={queryState.ownerFilter}
                                        onChange={onUserChange}
                                    />
                                ))}

                            {Boolean(projects?.length) &&
                                onProjectChange &&
                                nullable(projects, (pr) => (
                                    <ProjectFilterDropdown
                                        text={tr('Project')}
                                        projects={pr}
                                        value={queryState.projectFilter}
                                        onChange={onProjectChange}
                                    />
                                ))}

                            {Boolean(tags?.length) &&
                                onTagChange &&
                                nullable(tags, (ta) => (
                                    <TagsFilterDropdown
                                        text={tr('Tags')}
                                        tags={ta}
                                        value={queryState.tagsFilter}
                                        onChange={onTagChange}
                                    />
                                ))}

                            {Boolean(estimates?.length) &&
                                onEstimateChange &&
                                nullable(estimates, (e) => (
                                    <EstimateFilterDropdown
                                        text={tr('Estimate')}
                                        estimates={e}
                                        value={queryState.estimateFilter}
                                        onChange={onEstimateChange}
                                    />
                                ))}

                            {onLimitChange &&
                                nullable(queryState.limitFilter, (lf) => (
                                    <LimitFilterDropdown text={tr('Limit')} value={lf} onChange={onLimitChange} />
                                ))}

                            {Boolean(presets?.length) &&
                                nullable(presets, (pr) => (
                                    <PresetFilterDropdown
                                        text={tr('Preset')}
                                        presets={pr}
                                        value={currentPreset ? currentPreset.id : undefined}
                                        onChange={onPresetChange}
                                    />
                                ))}

                            {((Boolean(queryString) && !currentPreset) ||
                                (currentPreset && !currentPreset._isOwner && !currentPreset._isStarred)) && (
                                <StyledFiltersAction onClick={onFilterStar}>
                                    <StarIcon size="s" noWrap />
                                </StyledFiltersAction>
                            )}

                            {currentPreset && (currentPreset._isOwner || currentPreset._isStarred) && (
                                <StyledFiltersAction onClick={onFilterStar}>
                                    <StarFilledIcon size="s" noWrap />
                                </StyledFiltersAction>
                            )}
                        </StyledFiltersMenu>
                    </StyledFiltersMenuWrapper>

                    {nullable(children, (ch) => (
                        <div style={{ textAlign: 'right' }}>{ch}</div>
                    ))}
                </StyledFiltersContent>
            </StyledFiltersPanel>

            <FiltersPanelApplied
                queryState={queryState}
                states={states}
                priority={priority}
                users={users}
                projects={projects}
                tags={tags}
                estimates={estimates}
            />
        </>
    );
};

FiltersPanel.whyDidYouRender = true;
