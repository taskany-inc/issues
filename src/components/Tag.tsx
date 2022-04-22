import styled, { css } from 'styled-components';

import { backgroundColor } from '../design/@generated/themes';

interface TagProps {
    color: string;
    title: string;
    description?: string;
    onClick?: () => void;
    onHide?: () => void;
}

const StyledCleanButton = styled.div<{ color: TagProps['color'] }>`
    display: none;
    position: absolute;
    transform: rotate(45deg);
    top: -6px;
    right: -6px;
    width: 12px;
    height: 12px;
    line-height: 12px;
    text-align: center;
    font-size: 12px;
    border-radius: 100%;
    cursor: pointer;
    color: ${backgroundColor};
    pointerevents: none;

    ${({ color }) => css`
        background-color: ${color};

        &:hover {
            background-color: ${color};
        }
    `}
`;

const StyledTag = styled.div<{ color: TagProps['color']; onClick: TagProps['onClick'] }>`
    display: inline-block;
    position: relative;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: default;
    user-select: none;

    ${({ color }) => css`
        border: 2px solid ${color};
        color: ${color};
    `}

    &:hover {
        ${StyledCleanButton} {
            display: block;
        }
    }

    & + & {
        margin-left: 6px;
    }

    ${({ onClick }) =>
        onClick &&
        css`
            cursor: pointer;
        `}
`;

export const Tag: React.FC<TagProps> = ({ title, description, color, onClick, onHide }) => {
    return (
        <StyledTag color={color} onClick={onClick} title={description}>
            {onHide && (
                <StyledCleanButton color={color} onClick={onHide}>
                    +
                </StyledCleanButton>
            )}
            {title}
        </StyledTag>
    );
};
