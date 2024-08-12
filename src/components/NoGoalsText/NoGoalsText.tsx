import { Text } from '@taskany/bricks/harmony';

import { tr } from './NoGoalsText.i18n';

export const NoGoalsText = () => {
    return <Text size="m">{tr('No goals yet')}</Text>;
};
