import styled, { css } from 'styled-components';

import { danger0, gapM, gray4, warn0 } from '../design/@generated/themes';

import { FormCard } from './FormCard';
import { PageContent } from './Page';

type SettingsCardViewType = 'default' | 'warning' | 'danger';

const StyledSettingsContent = styled(PageContent)`
    display: grid;
    grid-template-columns: 7fr 5fr;
`;

const colorsMap: Record<SettingsCardViewType, string> = {
    default: gray4,
    warning: warn0,
    danger: danger0,
};

export const SettingsCard = styled(FormCard)<{ view?: SettingsCardViewType }>`
    & + & {
        margin-top: ${gapM};
    }

    ${({ view = 'default' }) => css`
        border-color: ${colorsMap[view]};
    `}
`;

export const SettingsContent: React.FC = ({ children }) => {
    return (
        <StyledSettingsContent>
            <div>{children}</div>
        </StyledSettingsContent>
    );
};
