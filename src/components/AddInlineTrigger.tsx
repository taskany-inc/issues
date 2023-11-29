import { IconPlusCircleOutline } from '@taskany/icons';
import { ComponentProps, forwardRef } from 'react';
import styled from 'styled-components';

import { InlineTrigger } from './InlineTrigger';

const StyledInlineTrigger = styled(InlineTrigger)<{ centered?: boolean }>`
    ${({ centered }) =>
        centered &&
        `
            margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
    `}
    height: 28px; // Input height
`;

interface AddInlineTriggerProps {
    text: string;
    onClick: ComponentProps<typeof InlineTrigger>['onClick'];
    icon?: React.ReactNode;
    centered?: boolean;
}

export const AddInlineTrigger = forwardRef<HTMLDivElement, AddInlineTriggerProps>(
    ({ icon = <IconPlusCircleOutline size="xs" />, text, onClick, centered = true }, ref) => (
        <StyledInlineTrigger ref={ref} icon={icon} text={text} onClick={onClick} centered={centered} />
    ),
);
