import React, { useCallback, useMemo } from 'react';
import { AutoComplete, AutoCompleteList } from '@taskany/bricks/harmony';

import type { FilterQueryState, SortableProps, SortDirection } from '../../hooks/useUrlFilterParams';
import { SortButton } from '../SortButton/SortButton';

import { tr } from './SortList.i18n';
import styles from './SortList.module.css';

interface SortListProps {
    value?: FilterQueryState['sort'];
    onChange: (key: SortableProps, dir: SortDirection | null) => void;
}

interface SingleSortItem {
    id: SortableProps;
    title: string;
    dir: SortDirection | null;
}

export const SortList: React.FC<SortListProps> = ({ value, onChange }) => {
    const sortItems: { [K in SortableProps]: string } = useMemo(
        () => ({
            title: tr('Title'),
            state: tr('State'),
            priority: tr('Priority'),
            project: tr('Project'),
            activity: tr('Activity'),
            owner: tr('Owner'),
            updatedAt: tr('UpdatedAt'),
            createdAt: tr('CreatedAt'),
        }),
        [],
    );

    const itemsToRender: SingleSortItem[] = useMemo(() => {
        return (Object.entries(sortItems) as Array<[SortableProps, string]>).map(([id, title]) => ({
            id,
            title,
            dir: null,
        }));
    }, [sortItems]);

    const selected: SingleSortItem[] | undefined = useMemo(() => {
        return value?.map(({ key, dir }) => ({ id: key, title: sortItems[key], dir }));
    }, [value, sortItems]);

    const handleChange = useCallback(
        (key: SortableProps) => (dir: SortDirection | null) => {
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
