import { FC } from 'react';
import { MarkedListItem } from '@taskany/bricks';
import styled from 'styled-components';

import { StateDot } from './StateDot';
import { StateWrapper, stateBgHover } from './StateWrapper';

const StyledMenuListItem = styled(MarkedListItem)`
    :hover {
        background-color: ${stateBgHover};
    }
`;

export const ColorizedMenuItem: FC<{
    hue: number;
    children?: React.ReactNode;
    focused?: boolean;
    checked?: boolean;
    onClick?: () => void;
}> = ({ hue, children, ...props }) => {
    return (
        <StateWrapper hue={hue}>
            <StyledMenuListItem mark={<StateDot hue={hue} />} {...props}>
                {children}
            </StyledMenuListItem>
        </StateWrapper>
    );
};
