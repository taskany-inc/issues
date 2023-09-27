import { nullable, Link, Text } from '@taskany/bricks';
import { gapXs, gray8 } from '@taskany/colors';
import styled from 'styled-components';

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    name?: string | null;
    timeAgo: React.ReactNode;
    href?: string;
}

const StyledCardHeader = styled.div`
    display: inline-flex;
`;

const StyledSeparator = styled.span`
    margin-left: ${gapXs};
`;

export const CardHeader: React.FC<CardHeaderProps> = ({ name, timeAgo, href, ...attrs }) => {
    return (
        <StyledCardHeader {...attrs}>
            {nullable(name, (n) => (
                <Text size="xs" color={gray8} weight="bold">
                    {n}
                </Text>
            ))}
            {nullable(timeAgo, (node) => (
                <>
                    {nullable(name, () => (
                        <StyledSeparator>—</StyledSeparator>
                    ))}
                    {href ? (
                        <Link inline href={href}>
                            {node}
                        </Link>
                    ) : (
                        timeAgo
                    )}
                </>
            ))}
        </StyledCardHeader>
    );
};
