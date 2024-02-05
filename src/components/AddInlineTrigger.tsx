import { IconPlusCircleOutline } from '@taskany/icons';
import { ComponentProps, forwardRef } from 'react';
import styled from 'styled-components';

import { InlineTrigger } from './InlineTrigger';

type InlineTriggerProps = ComponentProps<typeof InlineTrigger>;

const StyledInlineTrigger = styled(
    ({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        centered,
        forwardRef,
        ...props
    }: InlineTriggerProps & { centered?: boolean; forwardRef: InlineTriggerProps['ref'] }) => (
        <InlineTrigger ref={forwardRef} {...props} />
    ),
)`
    ${({ centered }) =>
        centered &&
        `
            margin-left: 5px; // 24 / 2 - 7 center of UserPic and center of PlusIcon
    `}
    height: 28px; // Input height
`;

interface AddInlineTriggerProps {
    text: string;
    onClick: InlineTriggerProps['onClick'];
    icon?: React.ReactNode;
    centered?: boolean;
}

export const AddInlineTrigger = forwardRef<HTMLDivElement, AddInlineTriggerProps>(
    ({ icon = <IconPlusCircleOutline size="xs" />, text, onClick, centered = true, ...attrs }, ref) => (
        <StyledInlineTrigger
            forwardRef={ref}
            icon={icon}
            text={text}
            onClick={onClick}
            centered={centered}
            {...attrs}
        />
    ),
);
