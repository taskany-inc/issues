import { FC, useCallback, useMemo } from 'react';
import { FiltersDropdownBase, MenuItem, Text } from '@taskany/bricks';
import { gray8 } from '@taskany/colors';

import { tr } from './SortFilter.i18n';

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

const getNextDirection = (currentDirection: SortDirection): SortDirection => {
    switch (currentDirection) {
        case 'asc':
            return 'desc';
        case 'desc':
            return null;
        default:
            return 'asc';
    }
};

export const SortFilter: FC<{
    text: string;
    value: Record<SortableProps, NonNullable<SortDirection>> | Record<string, never>;
    onChange: (value: Record<SortableProps, NonNullable<SortDirection>>) => void;
}> = ({ text, value, onChange }) => {
    const sortableProps = useMemo<Record<SortableProps, string>>(
        () => ({
            title: tr('title'),
            state: tr('state'),
            priority: tr('priority'),
            project: tr('project'),
            activity: tr('activity'),
            owner: tr('owner'),
            updatedAt: tr('updatedAt'),
            createdAt: tr('createdAt'),
        }),
        [],
    );

    const items = useMemo(
        () =>
            Object.entries(sortableProps).map(([id, text]) => {
                const direction = value[id as SortableProps];
                return {
                    item: {
                        id,
                        data: {
                            text,
                            direction,
                            selected: Boolean(direction),
                        },
                    },
                };
            }),
        [value, sortableProps],
    );

    type SortFilterItems = typeof items;

    const onClick = useCallback(
        (id: SortableProps, direction: SortDirection) => () => {
            let newValue = { ...value } as Record<SortableProps, NonNullable<SortDirection>>;
            const nextDirection = getNextDirection(direction);

            if (!nextDirection) {
                delete newValue[id];
            } else {
                newValue = {
                    ...newValue,
                    [id]: nextDirection,
                };
            }

            onChange(newValue);
        },
        [value, onChange],
    );

    return (
        <FiltersDropdownBase
            text={text}
            items={items.map((el) => ({ id: el.item.id, data: el.item.data }))}
            value={Object.keys(value).length ? [''] : []}
            onChange={() => {}}
            renderItem={({
                item: {
                    id,
                    data: { text, direction },
                },
            }: SortFilterItems[number]) => (
                <MenuItem ghost key={id} onClick={onClick(id as SortableProps, direction)}>
                    {text}{' '}
                    <Text as="span" weight="bold" color={gray8} size="xs">
                        {direction}
                    </Text>
                </MenuItem>
            )}
        />
    );
};
