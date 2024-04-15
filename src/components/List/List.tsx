import { ReactNode } from 'react';
import cn from 'classnames';

import { TextList, TextListItem } from '../TextList/TextList';

import s from './List.module.css';

interface ColumnListProps<T> {
    list: T[];
    className?: string;
    renderItem: (item: T) => ReactNode;
}

export function List<T>({ list, className, renderItem }: ColumnListProps<T>) {
    return (
        <TextList listStyle="none" className={cn(s.List, className)}>
            {list.map((item, index) => (
                <TextListItem key={index}>{renderItem(item)}</TextListItem>
            ))}
        </TextList>
    );
}
