import styled from 'styled-components';
import { colorPrimary, danger9, gray5, warn0 } from '@taskany/colors';

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

    border-radius: 100%;

    margin-left: 6px;
    margin-right: 6px;

    background-color: ${({ view = 'default' }) => colorViewMap[view]};

    ${({ size = 'm' }) =>
        ({
            s: `
                width: 6px;
                height: 6px;
            `,
            m: `
                width: 8px;
                height: 8px;
            `,
        }[size])}
`;
