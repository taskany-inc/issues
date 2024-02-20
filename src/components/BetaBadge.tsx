import styled from 'styled-components';

const StyledBetaBadge = styled.span`
    position: absolute;

    color: var(--color-primary);
    font-weight: 500;
    font-size: 13px;
    padding-left: var(--gap-xs);
`;

interface BetaBadgeProps {
    className?: string;
}

export const BetaBadge: React.FC<BetaBadgeProps> = ({ className }) => (
    <StyledBetaBadge className={className}>β</StyledBetaBadge>
);
