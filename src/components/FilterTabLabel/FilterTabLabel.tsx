import React from 'react';
import { Text, nullable } from '@taskany/bricks';

import s from './FilterTabLabel.module.css';

interface TabLabelProps {
    text: string;
    selected?: string[];
}

export const FilterTabLabel: React.FC<TabLabelProps> = ({ text, selected }) => (
    <div className={s.LabelWrapper}>
        <Text className={s.LabelText}>
            {text}
            {nullable(selected, () => ': ')}
        </Text>
        {nullable(selected, (list) => (
            <Text ellipsis wordBreak="break-all" lines={1} title={list.join(', ')}>
                {list.join(', ')}
            </Text>
        ))}
    </div>
);
