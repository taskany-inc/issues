import React from 'react';
import styled from 'styled-components';
import { useTranslations } from 'next-intl';

import { dispatchModalEvent, ModalEvent } from '../utils/dispatchModal';
import { gapM, gapS, gray5 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { Badge } from './Badge';
import { Input } from './Input';
import { PageContent } from './Page';
import { StateFilter } from './StateFilter';
import { UserFilter } from './UserFilter';
import { TagsFilter } from './TagsFilter';
import { LimitFilter } from './LimitFilter';
import { Button } from './Button';

export { defaultLimit } from './LimitFilter';

interface FiltersPanelProps {
    count?: number;
    flowId?: React.ComponentProps<typeof StateFilter>['flowId'];
    users?: React.ComponentProps<typeof UserFilter>['activity'];
    tags?: React.ComponentProps<typeof TagsFilter>['tags'];

    onSearchChange: React.ComponentProps<typeof Input>['onChange'];
    onStateChange?: React.ComponentProps<typeof StateFilter>['onClick'];
    onUserChange?: React.ComponentProps<typeof UserFilter>['onClick'];
    onTagChange?: React.ComponentProps<typeof TagsFilter>['onClick'];
    onLimitChange?: React.ComponentProps<typeof LimitFilter>['onClick'];
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
    onSearchChange,
    onStateChange,
    onUserChange,
    onTagChange,
    onLimitChange,
}) => {
    const t = useTranslations('FiltersPanel');

    return (
        <StyledFiltersPanel>
            <StyledFiltersContent>
                <Input placeholder={t('Search')} onChange={onSearchChange} />

                <StyledFiltersMenuWrapper>
                    {nullable(count, () => (
                        <Badge size="m">{count}</Badge>
                    ))}

                    <StyledFiltersMenu>
                        {nullable(flowId, (id) => (
                            <StateFilter text={t('State')} flowId={id} onClick={onStateChange} />
                        ))}
                        {nullable(users, (u) => (
                            <UserFilter text={t('Owner')} activity={u} onClick={onUserChange} />
                        ))}
                        {nullable(tags, (ta) => (
                            <TagsFilter text={t('Tags')} tags={ta} onClick={onTagChange} />
                        ))}
                        {nullable(onLimitChange, (olc) => (
                            <LimitFilter text={t('Limit')} onClick={olc} />
                        ))}
                    </StyledFiltersMenu>
                </StyledFiltersMenuWrapper>

                <div style={{ textAlign: 'right' }}>
                    <Button
                        view="primary"
                        size="m"
                        text={t('New goal')}
                        onClick={dispatchModalEvent(ModalEvent.GoalCreateModal)}
                    />
                </div>
            </StyledFiltersContent>
        </StyledFiltersPanel>
    );
};
