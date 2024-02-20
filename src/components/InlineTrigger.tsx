import { Text } from '@taskany/bricks';
import { forwardRef } from 'react';
import styled from 'styled-components';

interface InlineTriggerProps {
    text: React.ReactNode;
    /** recommended props: size="xs" */
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

    color: var(--gray8);

    &:hover {
        color: var(--text-color);
    }
`;

const StyledInlineTriggerText = styled.span`
    display: flex;
    padding-left: var(--gap-s);
`;

const StyledIconContainer = styled.span`
    /** @awinogradov: I'm not sure this is the best decision.
     *  Maybe would be better get icon as component via prop and add flex styles.
     */
    & > span {
        display: flex;
    }
`;

export const InlineTrigger = forwardRef<HTMLDivElement, InlineTriggerProps>(
    ({ text, icon, className, onClick, ...attrs }, ref) => {
        return (
            <StyledInlineTrigger forwardRef={ref} size="s" className={className} onClick={onClick} {...attrs}>
                <StyledIconContainer>{icon}</StyledIconContainer>
                <StyledInlineTriggerText>{text}</StyledInlineTriggerText>
            </StyledInlineTrigger>
        );
    },
);
