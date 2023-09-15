import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Tab, Text, nullable } from '@taskany/bricks';
import { gapXs, gray8 } from '@taskany/colors';

import { FilterTabLabel } from '../FilterTabLabel';
import { FilterBase } from '../FilterBase/FilterBase';

import { tr, I18nKey } from './SortFilter.i18n';

export const sortFilterTr = tr;

export type SortDirection = 'asc' | 'desc' | null;
export type SortableProps =
    | 'title'
    | 'state'
    | 'priority'
    | 'project'
    | 'activity'
    | 'owner'
    | 'updatedAt'
    | 'createdAt';

const getNextDirection = (currentDirection?: SortDirection): SortDirection => {
    switch (currentDirection) {
        case 'asc':
            return 'desc';
        case 'desc':
            return null;
        default:
            return 'asc';
    }
};

const sortParams: SortableProps[] = [
    'title',
    'state',
    'priority',
    'project',
    'activity',
    'owner',
    'createdAt',
    'updatedAt',
];

const StyledSortItem = styled(Text)`
    padding: ${gapXs} 0;
    display: flex;
    align-items: baseline;
    flex-wrap: nowrap;

    gap: ${gapXs};
`;

const StyledDirectionText = styled(Text)`
    display: inline-flex;
    line-height: 1;
`;

const getSortParamText = (key: I18nKey) => {
    const map: Record<I18nKey, string> = {
        title: tr('title'),
        state: tr('state'),
        priority: tr('priority'),
        project: tr('project'),
        activity: tr('activity'),
        owner: tr('owner'),
        updatedAt: tr('updatedAt'),
        createdAt: tr('createdAt'),
    };

    return map[key];
};

const SortFilterItem: FC<{ text: I18nKey; direction: SortDirection; onClick: () => void }> = ({
    text,
    direction,
    onClick,
}) => {
    return (
        <StyledSortItem onClick={onClick}>
            {getSortParamText(text)}
            {nullable(direction, (dir) => (
                <StyledDirectionText weight="bold" size="xs" color={gray8}>
                    {dir}
                </StyledDirectionText>
            ))}
        </StyledSortItem>
    );
};

const idIsSortParam = (id: string): id is SortableProps => {
    // Array.includes doesnt correcly works by strict sting type and strings without type casting
    for (let i = 0; i < sortParams.length; i += 1) {
        if (sortParams[i] === id) {
            return true;
        }
    }
    return false;
};

const getKey = (key: SortableProps) => key;

export const SortFilter: FC<{
    text: string;
    value?: { [K in SortableProps]?: SortDirection };
    onChange: (value: { [K in SortableProps]?: SortDirection }) => void;
}> = memo(
    ({ text, value, onChange }) => {
        const [sortState, setSortState] = useState(() => value);

        const onClick = useCallback(([id]: string[]) => {
            const item = sortParams.find((param) => param === id);

            if (!item) {
                return;
            }

            setSortState((prev) => {
                if (prev == null) {
                    return { [id]: getNextDirection() };
                }

                if (idIsSortParam(id)) {
                    const next = { ...prev };

                    const nextDirecion = getNextDirection(next[id]);

                    if (nextDirecion != null) {
                        next[id] = nextDirecion;
                    } else {
                        delete next[id];
                    }

                    return next;
                }

                return undefined;
            });
        }, []);

        useEffect(() => {
            if (sortState) {
                onChange(sortState);
            }
        }, [sortState, onChange]);

        const selected = useMemo(() => {
            if (sortState == null) {
                return [];
            }

            const result: string[] = [];

            for (const [id, dir] of Object.entries(sortState)) {
                if (idIsSortParam(id)) {
                    result.push(`${getSortParamText(id)}(${dir})`);
                }
            }

            return result;
        }, [sortState]);

        return (
            <Tab name="sort" label={<FilterTabLabel text={text} selected={selected} />}>
                <FilterBase
                    key="sort"
                    mode="single"
                    viewMode="union"
                    items={sortParams}
                    onChange={onClick}
                    keyGetter={getKey}
                    renderItem={({ item, onItemClick }) => {
                        const direction = sortState?.[item] ?? null;

                        return <SortFilterItem text={item} direction={direction} onClick={onItemClick} />;
                    }}
                />
            </Tab>
        );
    },
    (prev, next) => {
        return Object.is(prev.value, next.value);
    },
);
