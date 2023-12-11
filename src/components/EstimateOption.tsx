import { Text, nullable } from '@taskany/bricks';
import { gapXs, gapS, gray9, gray7 } from '@taskany/colors';
import { IconPlusCircleSolid, IconXCircleSolid } from '@taskany/icons';
import React, { ReactNode } from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: ${gapXs};
`;

const StyledContent = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapS};
`;

const StyledClue = styled(Text)`
    padding-bottom: ${gapS};
`;

interface EstimateOptionProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'className'> {
    title?: string;
    clue?: string | null;
    readOnly?: boolean;
    onClick?: () => void;
    onClose?: () => void;
    renderTrigger?: () => ReactNode;
}

export const EstimateOption: React.FC<EstimateOptionProps> = ({
    title,
    clue,
    readOnly,
    onClick,
    renderTrigger,
    onClose,
    ...attrs
}) => {
    return (
        <StyledWrapper>
            <StyledContent>
                {nullable(title, (t) => (
                    <Text size="s">{t}</Text>
                ))}

                {nullable(
                    readOnly,
                    () => (
                        <IconPlusCircleSolid size="xs" color={gray9} onClick={onClick} {...attrs} />
                    ),
                    <IconXCircleSolid size="xs" color={gray9} onClick={onClose} {...attrs} />,
                )}
            </StyledContent>

            {nullable(clue, (c) => (
                <StyledClue size="xs" color={gray7}>
                    {c}
                </StyledClue>
            ))}

            {nullable(!readOnly, () => renderTrigger?.())}
        </StyledWrapper>
    );
};
