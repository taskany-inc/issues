import { Text, nullable } from '@taskany/bricks';
import { gapXs, gapS, gray9, gray7 } from '@taskany/colors';
import { IconPlusCircleSolid } from '@taskany/icons';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapXs};
`;

const StyledContent = styled.div`
    display: flex;
    align-items: end;
    gap: ${gapS};
`;

interface EstimateOptionProps {
    title?: string;
    clue?: string | null;
    readOnly?: boolean;
    onClick?: () => void;
    renderTrigger?: () => ReactNode;
}

export const EstimateOption: React.FC<EstimateOptionProps> = ({ title, clue, readOnly, onClick, renderTrigger }) => {
    return (
        <StyledWrapper>
            <StyledContent>
                {nullable(title, (t) => (
                    <Text size="s">{t}</Text>
                ))}

                {nullable(readOnly, () => (
                    <IconPlusCircleSolid size="xs" color={gray9} onClick={onClick} />
                ))}
            </StyledContent>

            {nullable(clue, (c) => (
                <Text size="xxs" color={gray7}>
                    {c}
                </Text>
            ))}

            {nullable(!readOnly, () => renderTrigger?.())}
        </StyledWrapper>
    );
};
