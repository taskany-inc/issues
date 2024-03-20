import { IconExclamationCircleOutline } from '@taskany/icons';
import { Tooltip } from '@taskany/bricks/harmony';

import { tr } from './PrivateDepsWarning.i18n';
import s from './PrivateDepsWarning.module.css';

export const PrivateDepsWarning = () => (
    <Tooltip
        target={<IconExclamationCircleOutline size="s" className={s.PrivateDepsWarningIcon} />}
        view="warning"
        placement="top"
    >
        {tr('Goal has private dependencies')}
    </Tooltip>
);
