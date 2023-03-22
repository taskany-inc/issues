import { Priority as PriorityType } from '../../types/priority';

import { tr } from './priority.i18n';

export const trPriority = (priority: PriorityType) => {
    const map: Record<PriorityType, string> = {
        High: tr('High'),
        Highest: tr('Highest'),
        Medium: tr('Medium'),
        Low: tr('Low'),
    };

    return map[priority];
};
