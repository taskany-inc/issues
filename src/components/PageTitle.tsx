import { Text } from '@taskany/bricks';
import { gapS, gray4, gray6, gray7 } from '@taskany/colors';
import styled from 'styled-components';

interface PageTitleProps {
    title?: string;
    subtitle?: string;
    info?: string;

    onClick?: () => void;
}

const StyledText = styled(Text)`
    padding-left: ${gapS};

    transition: color 200ms ease-in-out;

    ${({ onClick }) =>
        onClick &&
        `
            cursor: pointer;

            :hover {
                color: ${gray7};
            }
    `}
`;

export const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, info, onClick }) => (
    <>
        {title}

        {subtitle && (
            <>
                :
                <StyledText as="span" size="xxl" weight="bolder" color={onClick ? gray4 : gray7} onClick={onClick}>
                    {subtitle}
                </StyledText>
            </>
        )}

        {info && (
            <StyledText as="span" size="s" weight="bold" color={gray6}>
                {info}
            </StyledText>
        )}
    </>
);
