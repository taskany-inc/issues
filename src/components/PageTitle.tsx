import { Text } from '@taskany/bricks';
import { gray4, gray7 } from '@taskany/colors';
import styled from 'styled-components';

interface PageTitleProps {
    title: string;
    subtitle?: string;
    onClick?: () => void;
}

const StyledText = styled(Text)`
    cursor: pointer;

    transition: color 200ms ease-in-out;

    ${({ onClick }) =>
        onClick &&
        `
            :hover {
                color: ${gray7};
            }
    `}
`;
export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, onClick }) => (
    <>
        {title}
        {subtitle && (
            <>
                :{' '}
                <StyledText as="span" size="xxl" weight="bolder" color={onClick ? gray4 : gray7} onClick={onClick}>
                    {subtitle}
                </StyledText>
            </>
        )}
    </>
);
