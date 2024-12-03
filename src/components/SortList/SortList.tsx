import React, { useCallback, useMemo } from 'react';
import { AutoComplete, AutoCompleteList } from '@taskany/bricks/harmony';

import type {
    FilterQueryState,
    SortableBaseProps,
    SortableGoalsProps,
    SortableProjectsProps,
    SortDirection,
} from '../../utils/parseUrlParams';
import { SortButton } from '../SortButton/SortButton';

import { tr } from './SortList.i18n';
import styles from './SortList.module.css';

interface SortListProps<T extends FilterQueryState['sort'] | FilterQueryState['projectsSort']> {
    variant?: 'goals' | 'projects';
    value?: T;
    onChange: (key: SortableGoalsProps | SortableProjectsProps, dir: SortDirection | null) => void;
}

interface SingleSortItem {
    id: SortableGoalsProps | SortableProjectsProps;
    title: string;
    dir: SortDirection | null;
}

export const SortList = <T extends FilterQueryState['sort'] | FilterQueryState['projectsSort']>({
    variant = 'goals',
    value,
    onChange,
}: SortListProps<T>) => {
    const { itemsToRender, sortItems } = useMemo(() => {
        const baseSortItems: Record<SortableBaseProps, string> = {
            title: tr('Title'),
            owner: tr('Owner'),
            updatedAt: tr('UpdatedAt'),
            createdAt: tr('CreatedAt'),
        };
        const sortGoalsItems: Record<Exclude<SortableGoalsProps, SortableProjectsProps>, string> = {
            state: tr('State'),
            activity: tr('Activity'),
            priority: tr('Priority'),
            project: tr('Project'),
            rankGlobal: tr('Manual'),
        };

        const sortProjectItems: Record<Exclude<SortableProjectsProps, SortableGoalsProps>, string> = {
            stargizers: tr('Stargizers'),
            watchers: tr('Watchers'),
            goals: tr('Goals'),
        };

        const sortItems =
            variant === 'goals' ? { ...baseSortItems, ...sortGoalsItems } : { ...baseSortItems, ...sortProjectItems };

        return {
            sortItems,
            itemsToRender: (
                Object.entries(sortItems) as Array<[SortableGoalsProps | SortableProjectsProps, string]>
            ).map(([id, title]) => ({
                id,
                title,
                dir: null,
            })),
        };
    }, [variant]);

    const selected: SingleSortItem[] | undefined = useMemo(() => {
        return value?.map(({ key, dir }) => ({
            id: key,
            title: sortItems[key as SortableBaseProps],
            dir,
        }));
    }, [value, sortItems]);

    const handleChange = useCallback(
        (key: SortableGoalsProps | SortableProjectsProps) => (dir: SortDirection | null) => {
            onChange(key, dir);
        },
        [onChange],
    );

    return (
        <div className={styles.SortList}>
            <AutoComplete
                items={itemsToRender}
                value={selected}
                renderItem={({ item }) => (
                    <SortButton title={item.title} value={item.dir} onChange={handleChange(item.id)} />
                )}
            >
                <div className={styles.SortListButtons}>
                    <AutoCompleteList selected />
                </div>
                <div className={styles.SortListButtons}>
                    <AutoCompleteList filterSelected />
                </div>
            </AutoComplete>
        </div>
    );
};
