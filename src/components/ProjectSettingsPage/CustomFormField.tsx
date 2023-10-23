import { ReactNode, FC } from 'react';
import styled from 'styled-components';
import { gapM, gapXs, gray3, gray8, radiusS, textColor } from '@taskany/colors';
import { Text, nullable } from '@taskany/bricks';

const StyledFormInputContainer = styled.div`
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    position: relative;

    border-radius: ${radiusS};

    background-color: ${gray3};
    color: ${textColor};
    font-weight: 600;
    font-size: 22px;
    width: 100%;
`;

const StyledLabel = styled(Text)`
    padding: 8px 8px 8px 16px;

    background-color: transparent;
`;

const StyledChildrenContainer = styled.div`
    flex: 1;
    padding: ${gapXs} ${gapM};
`;

export const CustomFormField: FC<{ children: ReactNode; label: string; name?: string }> = ({
    children,
    label,
    name,
}) => (
    <StyledFormInputContainer>
        {nullable(label, (l) => (
            <StyledLabel as="label" htmlFor={name} size="m" color={gray8} weight="bold">
                {l}
            </StyledLabel>
        ))}

        <StyledChildrenContainer>{children}</StyledChildrenContainer>
    </StyledFormInputContainer>
);
