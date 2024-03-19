import cn from 'classnames';
import React, { HTMLAttributes, useMemo } from 'react';

import s from './TextList.module.css';

interface TextListProps {
    type?: 'ordered' | 'unordered';
    listStyle?: React.CSSProperties['listStyle'];
    className?: string;
    children?: React.ReactNode;
}

export const TextList: React.FC<TextListProps> = ({ type = 'unordered', listStyle, className, children }) => {
    const Tag = type === 'ordered' ? 'ol' : 'ul';

    const styles = useMemo(() => {
        const map: Record<string, unknown> = {};

        if (listStyle) {
            map['--text-list-style'] = listStyle;
        }

        return map;
    }, [listStyle]);

    return (
        <Tag className={cn(s.TextList, className)} style={styles}>
            {children}
        </Tag>
    );
};

interface TextListItemProps extends HTMLAttributes<HTMLLIElement> {}

export const TextListItem = ({ children, className, ...props }: TextListItemProps) => (
    <li className={cn(s.TextListItem, className)} {...props}>
        {children}
    </li>
);
