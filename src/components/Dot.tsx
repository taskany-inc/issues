import styled, { css } from 'styled-components';

import { gray5 } from '../design/@generated/themes';

interface DotProps {
    size?: 's' | 'm';
}

export const Dot = styled.span<DotProps>`
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 100%;

    margin-left: 6px;
    margin-right: 6px;

    background-color: ${gray5};

    ${({ size }) =>
        size === 's' &&
        css`
            width: 6px;
            height: 6px;
        `}
`;

Dot.defaultProps = {
    size: 'm',
};
