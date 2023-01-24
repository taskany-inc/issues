import React from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';

import { gapM, gapS, gray5 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { Badge } from './Badge';
import { Input } from './Input';
import { PageContent } from './Page';
import { StateFilterDropdown } from './StateFilterDropdown';
import { UserFilterDropdown } from './UserFilterDropdown';
import { TagsFilterDropdown } from './TagsFilterDropdown';
import { LimitFilterDropdown } from './LimitFilterDropdown';
import { PriorityFilterDropdown } from './PriorityFilterDropdown';

interface FiltersPanelProps {
    count?: number;
    flowId?: React.ComponentProps<typeof StateFilterDropdown>['flowId'];
    users?: React.ComponentProps<typeof UserFilterDropdown>['activity'];
    tags?: React.ComponentProps<typeof TagsFilterDropdown>['tags'];
    priorityFilter?: Array<string>;
    stateFilter?: Array<string>;
    ownerFilter?: Array<string>;
    tagsFilter?: Array<string>;
    searchFilter?: string;
    limitFilter?: number;
    children?: React.ReactNode;

    onSearchChange: React.ComponentProps<typeof Input>['onChange'];
    onPriorityChange?: React.ComponentProps<typeof PriorityFilterDropdown>['onChange'];
    onStateChange?: React.ComponentProps<typeof StateFilterDropdown>['onChange'];
    onUserChange?: React.ComponentProps<typeof UserFilterDropdown>['onChange'];
    onTagChange?: React.ComponentProps<typeof TagsFilterDropdown>['onChange'];
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
    flowId,
    users,
    tags,
    priorityFilter,
    stateFilter,
    ownerFilter,
    tagsFilter,
    searchFilter,
    limitFilter,
    onPriorityChange,
    onSearchChange,
    onStateChange,
    onUserChange,
    onTagChange,
    onLimitChange,
    children,
}) => {
    const t = useTranslations('FiltersPanel');

    return (
        <StyledFiltersPanel>
            <StyledFiltersContent>
                <Input placeholder={t('Search')} value={searchFilter} onChange={onSearchChange} />

                <StyledFiltersMenuWrapper>
                    {nullable(count, () => (
                        <Badge size="m">{count}</Badge>
                    ))}

                    <StyledFiltersMenu>
                        {nullable(onPriorityChange, (opc) => (
                            <PriorityFilterDropdown text={t('Priority')} value={priorityFilter} onChange={opc} />
                        ))}

                        {nullable(flowId, (id) => (
                            <StateFilterDropdown
                                text={t('State')}
                                flowId={id}
                                value={stateFilter}
                                onChange={onStateChange}
                            />
                        ))}
                        {nullable(users, (u) => (
                            <UserFilterDropdown
                                text={t('Owner')}
                                activity={u}
                                value={ownerFilter}
                                onChange={onUserChange}
                            />
                        ))}
                        {nullable(tags, (ta) => (
                            <TagsFilterDropdown text={t('Tags')} tags={ta} value={tagsFilter} onChange={onTagChange} />
                        ))}
                        {nullable(onLimitChange, (olc) => (
                            <LimitFilterDropdown text={t('Limit')} value={limitFilter} onChange={olc} />
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
