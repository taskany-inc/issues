import styled, { css } from 'styled-components';

import { gapM, gapS, gray6 } from '../design/@generated/themes';
import { nullable } from '../utils/nullable';

import { PageContent } from './Page';
import { Text } from './Text';

interface CommonHeaderProps {
    preTitle?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
}

const StyledCommonHeader = styled(PageContent)`
    display: grid;
    grid-template-columns: 8fr 4fr;
`;

const StyledCommonHeaderInfo = styled.div<{ align: 'left' | 'right' }>`
    ${({ align }) => css`
        justify-self: ${align};
    `}

    ${({ align }) =>
        align === 'right' &&
        css`
            display: grid;
            justify-items: end;
            align-content: space-between;
        `}
`;

const StyledCommonHeaderTitle = styled(Text)`
    padding-top: ${gapM};
`;

export const CommonHeader: React.FC<CommonHeaderProps> = ({ preTitle, title, description, children }) => {
    return (
        <StyledCommonHeader>
            <StyledCommonHeaderInfo align="left">
                {nullable(preTitle, (pT) => (
                    <Text size="m" weight="bold" color={gray6}>
                        {pT}
                    </Text>
                ))}

                <StyledCommonHeaderTitle size="xxl" weight="bolder">
                    {title}
                </StyledCommonHeaderTitle>

                {nullable(description, (d) => (
                    <Text size="m" color={gray6} style={{ paddingTop: gapS }}>
                        {d}
                    </Text>
                ))}
            </StyledCommonHeaderInfo>

            {children}
        </StyledCommonHeader>
    );
};
