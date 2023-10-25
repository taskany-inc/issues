import { Priority } from '../../types/priority';

import { tr } from './PriorityText.i18n';

export const getPriorityText = (priority: string) => {
    const map: Record<Priority['title'], string> = {
        High: tr('High'),
        Highest: tr('Highest'),
        Medium: tr('Medium'),
        Low: tr('Low'),
    };

    return map[priority];
};
