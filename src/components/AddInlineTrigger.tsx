import { ComponentProps, forwardRef } from 'react';
import styled from 'styled-components';
import { IconPlusCircleOutline } from '@taskany/icons';

import { InlineTrigger } from './InlineTrigger';

const StyledInlineTrigger = styled(InlineTrigger)`
    margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
    height: 28px; // Input height
`;

interface AddInlineTriggerProps {
    text: string;
    onClick: ComponentProps<typeof InlineTrigger>['onClick'];
    icon?: React.ReactNode;
}

export const AddInlineTrigger = forwardRef<HTMLDivElement, AddInlineTriggerProps>(
    ({ icon = <IconPlusCircleOutline size="xs" />, text, onClick }, ref) => (
        <StyledInlineTrigger ref={ref} icon={icon} text={text} onClick={onClick} />
    ),
);
