import { FC, ReactNode } from 'react';
import {
    FiltersAction,
    FiltersCounter,
    FiltersCounterContainer,
    FiltersMenuContainer,
    FiltersPanelContainer,
    FiltersPanelContent,
    FiltersSearchContainer,
    StarFilledIcon,
    StarIcon,
    nullable,
} from '@taskany/bricks';

import { QueryState } from '../../hooks/useUrlFilterParams';
import { SearchFilter } from '../SearchFilter';
import { ProjectFilter } from '../ProjectFilter';
import { TagFilter } from '../TagFilter';
import { EstimateFilter } from '../EstimateFilter';
import { PresetDropdown } from '../PresetDropdown';
import { LimitDropdown } from '../LimitDropdown';
import { UserFilter } from '../UserFilter';
import { PriorityFilter } from '../PriorityFilter';
import { StateFilter } from '../StateFilter';
import { FiltersPanelApplied } from '../FiltersPanelApplied/FiltersPanelApplied';
import { Priority } from '../../types/priority';
import { FilterById } from '../../../trpc/inferredTypes';

import { tr } from './FiltersPanel.i18n';

export const FiltersPanel: FC<{
    children?: ReactNode;
    loading?: boolean;
    total?: number;
    counter?: number;
    queryState: QueryState;
    queryString?: string;

    preset?: FilterById;
    priorities?: React.ComponentProps<typeof PriorityFilter>['priorities'];
    states?: React.ComponentProps<typeof StateFilter>['states'];
    projects?: React.ComponentProps<typeof ProjectFilter>['projects'];
    tags?: React.ComponentProps<typeof TagFilter>['tags'];
    estimates?: React.ComponentProps<typeof EstimateFilter>['estimates'];
    presets?: React.ComponentProps<typeof PresetDropdown>['presets'];
    users?: React.ComponentProps<typeof UserFilter>['users'];

    onSearchChange: (search: string) => void;
    onPriorityChange: React.ComponentProps<typeof PriorityFilter>['onChange'];
    onStateChange: React.ComponentProps<typeof StateFilter>['onChange'];
    onUserChange: React.ComponentProps<typeof UserFilter>['onChange'];
    onProjectChange: React.ComponentProps<typeof ProjectFilter>['onChange'];
    onTagChange: React.ComponentProps<typeof TagFilter>['onChange'];
    onEstimateChange: React.ComponentProps<typeof EstimateFilter>['onChange'];
    onPresetChange: React.ComponentProps<typeof PresetDropdown>['onChange'];
    onLimitChange?: React.ComponentProps<typeof LimitDropdown>['onChange'];
    onFilterStar?: () => void;
}> = ({
    children,
    loading,
    total = 0,
    counter = 0,
    queryState,
    queryString,
    preset,
    projects = [],
    tags = [],
    estimates = [],
    presets = [],
    users = [],
    priorities = [],
    states = [],
    onPriorityChange,
    onStateChange,
    onUserChange,
    onSearchChange,
    onProjectChange,
    onEstimateChange,
    onPresetChange,
    onTagChange,
    onLimitChange,
    onFilterStar,
}) => (
    <>
        <FiltersPanelContainer loading={loading}>
            <FiltersPanelContent>
                <FiltersSearchContainer>
                    <SearchFilter
                        placeholder={tr('Search')}
                        defaultValue={queryState.query}
                        onChange={onSearchChange}
                    />
                </FiltersSearchContainer>
                <FiltersCounterContainer>
                    <FiltersCounter total={total} counter={counter} />
                </FiltersCounterContainer>
                <FiltersMenuContainer>
                    {Boolean(priorities.length) && (
                        <StateFilter
                            text={tr('State')}
                            value={queryState.state}
                            states={states}
                            onChange={onStateChange}
                        />
                    )}
                    {Boolean(priorities.length) && (
                        <PriorityFilter
                            text={tr('Priority')}
                            value={queryState.priority}
                            priorities={priorities}
                            onChange={onPriorityChange}
                        />
                    )}
                    {Boolean(projects.length) && (
                        <ProjectFilter
                            text={tr('Project')}
                            value={queryState.project}
                            projects={projects}
                            onChange={onProjectChange}
                        />
                    )}
                    {Boolean(users.length) && (
                        <UserFilter text={tr('Owner')} value={queryState.owner} users={users} onChange={onUserChange} />
                    )}
                    {Boolean(estimates.length) && (
                        <EstimateFilter
                            text={tr('Estimate')}
                            value={queryState.estimate}
                            estimates={estimates}
                            onChange={onEstimateChange}
                        />
                    )}
                    {Boolean(tags.length) && (
                        <TagFilter text={tr('Tags')} value={queryState.tag} tags={tags} onChange={onTagChange} />
                    )}
                    {Boolean(presets.length) && (
                        <PresetDropdown
                            text={tr('Preset')}
                            value={preset}
                            presets={presets}
                            onChange={onPresetChange}
                        />
                    )}
                    {onLimitChange &&
                        nullable(queryState.limit, (lf) => (
                            <LimitDropdown text={tr('Limit')} value={[String(lf)]} onChange={onLimitChange} />
                        ))}
                    {((Boolean(queryString) && !preset) || (preset && !preset._isOwner && !preset._isStarred)) && (
                        <FiltersAction onClick={onFilterStar}>
                            <StarIcon size="s" noWrap />
                        </FiltersAction>
                    )}
                    {preset && (preset._isOwner || preset._isStarred) && (
                        <FiltersAction onClick={onFilterStar}>
                            <StarFilledIcon size="s" noWrap />
                        </FiltersAction>
                    )}
                </FiltersMenuContainer>
                {children}
            </FiltersPanelContent>
        </FiltersPanelContainer>
        <FiltersPanelApplied
            queryState={queryState}
            priority={priorities as Priority[]}
            states={states}
            users={users}
            projects={projects}
            tags={tags}
            estimates={estimates}
        />
    </>
);
