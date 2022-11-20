import styled, { css } from 'styled-components';

import { colorPrimary, danger9, gray5, warn0 } from '../design/@generated/themes';

type ViewType = 'default' | 'primary' | 'warning' | 'danger';

interface DotProps {
    size?: 's' | 'm';
    view?: ViewType;
}

const colorViewMap: Record<ViewType, string> = {
    default: gray5,
    primary: colorPrimary,
    warning: warn0,
    danger: danger9,
};

export const Dot = styled.span<DotProps>`
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 100%;

    margin-left: 6px;
    margin-right: 6px;

    ${({ size }) =>
        size === 's' &&
        css`
            width: 6px;
            height: 6px;
        `}

    ${({ view = 'default' }) => css`
        background-color: ${colorViewMap[view]};
    `}
`;

Dot.defaultProps = {
    size: 'm',
    view: 'default',
};
