import { gapS, gapXs, gray4, radiusS } from '@taskany/colors';
import styled from 'styled-components';

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    focused?: boolean;
    hovered?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ListItem = styled(({ focused, hovered, ...props }) => <div {...props} />)<ListItemProps>`
    outline: none;

    padding: ${gapXs};

    border-radius: ${radiusS};

    ${({ focused, hovered }) =>
        (focused || hovered) &&
        `
         background-color: ${gray4};
    `}
`;

export const ListItemIcons = styled.div`
    display: flex;
    align-items: center;
    gap: ${gapS};
`;
