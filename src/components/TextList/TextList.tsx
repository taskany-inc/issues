import cn from 'classnames';
import React, { HTMLAttributes, useMemo } from 'react';

import s from './TextList.module.css';

interface TextListProps {
    type?: 'ordered' | 'unordered';
    listStyle?: React.CSSProperties['listStyle'];
    className?: string;
    children?: React.ReactNode;
}

export const TextList = ({ type = 'unordered', listStyle, className, children }: TextListProps) => {
    const Tag = type === 'ordered' ? 'ol' : 'ul';

    const styles = useMemo(() => {
        const map: Record<string, unknown> = {};
        if (listStyle) {
            map['--list-style'] = listStyle;
        }
        return map;
    }, [listStyle]);

    return (
        <Tag style={styles} className={cn(s.TextList, className)}>
            {children}
        </Tag>
    );
};

export const TextListItem = ({ children, className, ...props }: HTMLAttributes<HTMLLIElement>) => (
    <li className={cn(s.TextListItem, className)} {...props}>
        {children}
    </li>
);
