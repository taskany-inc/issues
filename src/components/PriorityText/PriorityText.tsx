import { FC } from 'react';

import { Priority } from '../../types/priority';

import { tr } from './PriorityText.i18n';

export const getPriorityText = (priority: string) => {
    const map: Record<Priority, string> = {
        High: tr('High'),
        Highest: tr('Highest'),
        Medium: tr('Medium'),
        Low: tr('Low'),
    };

    return map[priority as Priority];
};

export const PriorityText: FC<{ value: Priority }> = ({ value }) => <>{getPriorityText(value)}</>;
