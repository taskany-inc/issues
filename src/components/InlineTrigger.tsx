import { Text } from '@taskany/bricks';
import { gray8, textColor } from '@taskany/colors';
import { forwardRef } from 'react';
import styled from 'styled-components';

interface InlineTriggerProps {
    text: React.ReactNode;
    /** recommended props: noWrap size="xs" */
    icon: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const StyledInlineTrigger = styled(Text)`
    display: flex;
    align-items: center;

    transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color;

    cursor: pointer;

    color: ${gray8};

    &:hover {
        color: ${textColor};
    }
`;

const StyledInlineTriggerText = styled.span`
    display: inline-block;
    padding-left: 0.7rem;
`;

export const InlineTrigger = forwardRef<HTMLDivElement, InlineTriggerProps>(
    ({ text, icon, className, onClick }, ref) => {
        return (
            <StyledInlineTrigger ref={ref} size="s" className={className} onClick={onClick}>
                {icon}
                <StyledInlineTriggerText>{text}</StyledInlineTriggerText>
            </StyledInlineTrigger>
        );
    },
);
