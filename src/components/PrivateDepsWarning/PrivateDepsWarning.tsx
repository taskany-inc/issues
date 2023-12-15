import styled from 'styled-components';
import { Popup } from '@taskany/bricks';
import { IconExclamationCircleOutline } from '@taskany/icons';
import { warn0 } from '@taskany/colors';

import { tr } from './PrivateDepsWarning.i18n';

const StyledWarningIcon = styled(IconExclamationCircleOutline)`
    display: flex;
`;

export const PrivateDepsWarning = () => (
    <Popup tooltip target={<StyledWarningIcon size="s" color={warn0} />} view="warning" placement="top">
        {tr('Goal has private dependencies')}
    </Popup>
);
