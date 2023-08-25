import { Text, nullable } from '@taskany/bricks';
import { gapXs, gapS, gray9, gray7 } from '@taskany/colors';
import { IconPlusCircleSolid } from '@taskany/icons';
import React, { ReactNode, useCallback } from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${gapXs};
`;

const StyledContent = styled.div`
    display: flex;
    gap: ${gapS};
`;

interface EstimateOptionProps {
    title?: string;
    clue?: string | null;
    readOnly?: boolean;
    onClickIcon?: () => void;
    renderTrigger?: () => ReactNode;
}

export const EstimateOption: React.FC<EstimateOptionProps> = ({
    title,
    clue,
    readOnly,
    onClickIcon,
    renderTrigger,
}) => {
    const onClick = useCallback(() => {
        onClickIcon?.();
    }, [onClickIcon]);

    return (
        <StyledWrapper>
            <StyledContent>
                {nullable(title, (t) => (
                    <Text weight="regular" size="s">
                        {t}
                    </Text>
                ))}

                {nullable(readOnly, () => (
                    <IconPlusCircleSolid size="xs" color={gray9} onClick={onClick} style={{ cursor: 'pointer' }} />
                ))}
            </StyledContent>

            {nullable(clue, (c) => (
                <Text weight="regular" size="xxs" color={gray7}>
                    {c}
                </Text>
            ))}

            {nullable(!readOnly, () => renderTrigger?.())}
        </StyledWrapper>
    );
};
