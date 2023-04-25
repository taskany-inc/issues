import { FC } from 'react';

import { Priority as PriorityType } from '../../types/priority';

import { tr } from './PriorityText.i18n';

export const getPriorityText = (priority: PriorityType) => {
    const map: Record<PriorityType, string> = {
        High: tr('High'),
        Highest: tr('Highest'),
        Medium: tr('Medium'),
        Low: tr('Low'),
    };

    return map[priority];
};

export const PriorityText: FC<{ value: PriorityType }> = ({ value }) => <>{getPriorityText(value)}</>;
