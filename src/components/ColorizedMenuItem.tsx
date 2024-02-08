import { FC, useMemo } from 'react';
import { MarkedListItem } from '@taskany/bricks';
import { Dot } from '@taskany/bricks/harmony';
import styled from 'styled-components';

const StyledMenuListItem = styled(MarkedListItem)`
    :hover {
        background-color: var(--state-hover-background);
    }
`;

interface ColorizedMenuItemProps {
    color?: string;
    hoverBackground?: string;

    children?: React.ReactNode;
    focused?: boolean;
    checked?: boolean;

    onClick?: () => void;
}

export const ColorizedMenuItem: FC<ColorizedMenuItemProps> = ({ color, hoverBackground, children, ...props }) => {
    const style = useMemo(
        () =>
            ({
                '--state-hover-background': hoverBackground,
            } as React.CSSProperties),
        [hoverBackground],
    );

    return (
        <StyledMenuListItem style={style} mark={<Dot size="m" color={color} />} {...props}>
            {children}
        </StyledMenuListItem>
    );
};
