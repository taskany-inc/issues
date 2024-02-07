import styled from 'styled-components';
import { danger0, gapM, gray4, warn0 } from '@taskany/colors';
import { FormCard } from '@taskany/bricks';

import { PageContent } from './PageContent/PageContent';

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
    &:not(:last-child) {
        margin-bottom: ${gapM};
    }

    border-color: ${({ view = 'default' }) => colorsMap[view]};
`;

export const SettingsContent: React.FC<{ children: React.ReactNode }> = ({ children, ...attrs }) => {
    return (
        <StyledSettingsContent {...attrs}>
            <div>{children}</div>
        </StyledSettingsContent>
    );
};
