import { forwardRef } from 'react';
import {
    FiltersPanel,
    FiltersMenuContainer,
    FiltersSearchContainer,
    FiltersSearch,
    FiltersCounter,
    FiltersCounterContainer,
    FiltersClearButton,
    FiltersApplied,
    FiltersState,
    FiltersControlRef,
    StarIcon,
    StyledFiltersAction,
    StarFilledIcon,
} from '@taskany/bricks';
import { ParsedUrlQuery } from 'querystring';

import { PresetFilterDropdown } from '../PresetFilterDropdown';
import { Filter } from '../../../graphql/@generated/genql';

import { PriorityFilter } from './PriorityFilter';
import { StateFilter } from './StateFilter';
import { ProjectFilter } from './ProjectFilter';
import { TagFilter } from './TagsFilter';
import { UserFilter } from './UserFilter';
import { EstimateFilter } from './EstimateFilter';
import { LimitFilter } from './LimitFilter';
import { tr } from './Filters.i18n';

export const SearchFilterId = 'search';
export const EstimateFilterId = 'estimates';
export const PriorityFilterId = 'priority';
export const ProjectFilterId = 'projects';
export const StateFilterId = 'state';
export const TagFilterId = 'tags';
export const UserFilterId = 'user';
export const LimitFilterId = 'limit';

export const filtersFields = [
    PriorityFilterId,
    StateFilterId,
    TagFilterId,
    EstimateFilterId,
    UserFilterId,
    ProjectFilterId,
    SearchFilterId,
    LimitFilterId,
];

export const applyPanelOrder = [
    PriorityFilterId,
    StateFilterId,
    UserFilterId,
    ProjectFilterId,
    TagFilterId,
    EstimateFilterId,
];

type FiltersProps = {
    loading?: boolean;
    preset?: Filter;
    query: ParsedUrlQuery;
    queryString: string;
    onStateChange?: (state: FiltersState) => void;
    onFilterStar?: () => void;
    onPresetChange?: React.ComponentProps<typeof PresetFilterDropdown>['onChange'];
    estimates?: React.ComponentProps<typeof EstimateFilter>['estimates'];
    activities?: React.ComponentProps<typeof UserFilter>['activities'];
    priority?: React.ComponentProps<typeof PriorityFilter>['priority'];
    projects?: React.ComponentProps<typeof ProjectFilter>['projects'];
    states?: React.ComponentProps<typeof StateFilter>['states'];
    tags?: React.ComponentProps<typeof TagFilter>['tags'];
    presets?: React.ComponentProps<typeof PresetFilterDropdown>['presets'];
    counter?: number;
    total?: number;
};

export const Filters = forwardRef<FiltersControlRef, FiltersProps>(
    (
        {
            onStateChange,
            onPresetChange,
            onFilterStar,
            priority = [],
            states = [],
            projects = [],
            tags = [],
            activities = [],
            estimates = [],
            presets = [],
            queryString = '',
            preset,
            loading,
            counter,
            total = 0,
        },
        ref,
    ) => {
        const isEmpty = !queryString.length;

        return (
            <FiltersPanel
                ref={ref}
                loading={loading}
                onChange={onStateChange}
                note={<FiltersApplied fields={applyPanelOrder} />}
            >
                <FiltersSearchContainer>
                    <FiltersSearch id={SearchFilterId} title={tr('Search')} placeholder={tr('Search')} />
                </FiltersSearchContainer>
                <FiltersCounterContainer>
                    <FiltersCounter counter={counter} total={total} />
                </FiltersCounterContainer>
                <FiltersMenuContainer>
                    {Boolean(priority.length) && (
                        <PriorityFilter id={PriorityFilterId} title={tr('Priority')} priority={priority} />
                    )}
                    {Boolean(states.length) && <StateFilter id={StateFilterId} title={tr('State')} states={states} />}
                    {Boolean(activities.length) && (
                        <UserFilter id={UserFilterId} title={tr('Owner')} activities={activities} />
                    )}
                    {Boolean(projects.length) && (
                        <ProjectFilter id={ProjectFilterId} title={tr('Project')} projects={projects} />
                    )}
                    {Boolean(tags.length) && <TagFilter id={TagFilterId} title={tr('Tags')} tags={tags} />}
                    {Boolean(estimates.length) && (
                        <EstimateFilter id={EstimateFilterId} title={tr('Estimate')} estimates={estimates} />
                    )}
                    {/* <LimitFilter id={LimitFilterId} title={tr('Limit')} /> */}
                    {Boolean(presets.length) && (
                        <PresetFilterDropdown
                            text={tr('Preset')}
                            presets={presets}
                            value={preset ? preset.id : undefined}
                            onChange={onPresetChange}
                        />
                    )}
                    {((Boolean(!isEmpty) && !preset) || (preset && !preset._isOwner && !preset._isStarred)) && (
                        <StyledFiltersAction onClick={onFilterStar}>
                            <StarIcon size="s" noWrap />
                        </StyledFiltersAction>
                    )}

                    {preset && (preset._isOwner || preset._isStarred) && (
                        <StyledFiltersAction onClick={onFilterStar}>
                            <StarFilledIcon size="s" noWrap />
                        </StyledFiltersAction>
                    )}
                </FiltersMenuContainer>
                {!isEmpty && <FiltersClearButton text="Сбросить" />}
            </FiltersPanel>
        );
    },
);
