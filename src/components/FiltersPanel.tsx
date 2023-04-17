import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';
import { gapM, gapS, gray5, textColor } from '@taskany/colors';
import { Badge, Text, Input, nullable } from '@taskany/bricks';

import { PageContent } from './Page';
import { StateFilterDropdown } from './StateFilterDropdown';
import { UserFilterDropdown } from './UserFilterDropdown';
import { TagsFilterDropdown } from './TagsFilterDropdown';
import { LimitFilterDropdown } from './LimitFilterDropdown';
import { PriorityFilterDropdown } from './PriorityFilterDropdown';
import { EstimateFilterDropdown } from './EstimateFilterDropdown';
import { ProjectFilterDropdown } from './ProjectFilterDropdown';

interface FiltersPanelProps {
    count?: number;
    filteredCount?: number;
    priority?: React.ComponentProps<typeof PriorityFilterDropdown>['priority'];
    states?: React.ComponentProps<typeof StateFilterDropdown>['states'];
    users?: React.ComponentProps<typeof UserFilterDropdown>['activity'];
    projects?: React.ComponentProps<typeof ProjectFilterDropdown>['projects'];
    tags?: React.ComponentProps<typeof TagsFilterDropdown>['tags'];
    estimates?: React.ComponentProps<typeof EstimateFilterDropdown>['estimates'];
    filterValues: [string[], string[], string[], string[], string[], string[], string, number | undefined];
    children?: React.ReactNode;

    onSearchChange: (search: string) => void;
    onPriorityChange?: React.ComponentProps<typeof PriorityFilterDropdown>['onChange'];
    onStateChange?: React.ComponentProps<typeof StateFilterDropdown>['onChange'];
    onUserChange?: React.ComponentProps<typeof UserFilterDropdown>['onChange'];
    onProjectChange?: React.ComponentProps<typeof ProjectFilterDropdown>['onChange'];
    onTagChange?: React.ComponentProps<typeof TagsFilterDropdown>['onChange'];
    onEstimateChange?: React.ComponentProps<typeof EstimateFilterDropdown>['onChange'];
    onLimitChange?: React.ComponentProps<typeof LimitFilterDropdown>['onChange'];
}

const StyledFiltersPanel = styled.div`
    margin: ${gapM} 0;
    padding: ${gapS} 0;

    background-color: ${gray5};
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

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
    count,
    filteredCount,
    states,
    priority,
    users,
    projects,
    tags,
    estimates,
    filterValues,
    onPriorityChange,
    onSearchChange,
    onStateChange,
    onUserChange,
    onProjectChange,
    onTagChange,
    onEstimateChange,
    onLimitChange,
    children,
}) => {
    const t = useTranslations('FiltersPanel');

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

    const onSearchInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            onSearchChange(e.currentTarget.value);
        },
        [onSearchChange],
    );

    return (
        <StyledFiltersPanel>
            <StyledFiltersContent>
                <Input placeholder={t('Search')} value={searchFilter} onChange={onSearchInputChange} />

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
                                    text={t('Priority')}
                                    priority={pr}
                                    value={priorityFilter}
                                    onChange={onPriorityChange}
                                />
                            ))}

                        {Boolean(states?.length) &&
                            onStateChange &&
                            nullable(states, (st) => (
                                <StateFilterDropdown
                                    text={t('State')}
                                    states={st}
                                    value={stateFilter}
                                    onChange={onStateChange}
                                />
                            ))}

                        {Boolean(users?.length) &&
                            onUserChange &&
                            nullable(users, (u) => (
                                <UserFilterDropdown
                                    text={t('Owner')}
                                    activity={u}
                                    value={ownerFilter}
                                    onChange={onUserChange}
                                />
                            ))}

                        {Boolean(projects?.length) &&
                            onProjectChange &&
                            nullable(projects, (pr) => (
                                <ProjectFilterDropdown
                                    text={t('Project')}
                                    projects={pr}
                                    value={projectFilter}
                                    onChange={onProjectChange}
                                />
                            ))}

                        {Boolean(tags?.length) &&
                            onTagChange &&
                            nullable(tags, (ta) => (
                                <TagsFilterDropdown
                                    text={t('Tags')}
                                    tags={ta}
                                    value={tagsFilter}
                                    onChange={onTagChange}
                                />
                            ))}

                        {Boolean(estimates?.length) &&
                            onEstimateChange &&
                            nullable(estimates, (e) => (
                                <EstimateFilterDropdown
                                    text={t('Estimate')}
                                    estimates={e}
                                    value={estimateFilter}
                                    onChange={onEstimateChange}
                                />
                            ))}

                        {onLimitChange &&
                            nullable(limitFilter, (lf) => (
                                <LimitFilterDropdown text={t('Limit')} value={lf} onChange={onLimitChange} />
                            ))}
                    </StyledFiltersMenu>
                </StyledFiltersMenuWrapper>

                {nullable(children, (ch) => (
                    <div style={{ textAlign: 'right' }}>{ch}</div>
                ))}
            </StyledFiltersContent>
        </StyledFiltersPanel>
    );
};
