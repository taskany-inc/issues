import React from 'react';
import styled, { css } from 'styled-components';

import { linkTextColor } from '../design/@generated/themes';

interface LinkProps extends React.HTMLProps<HTMLLinkElement> {
    inline?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const StyledLink = styled(({ forwardRef, inline, ...props }) => <a ref={forwardRef} {...props} />)`
    color: ${linkTextColor};

    transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color, background-color, border-color;

    cursor: pointer;

    &:hover,
    &:focus {
        transition-duration: 0.1s;
    }

    ${({ inline }) =>
        inline &&
        css`
            color: inherit;
            text-decoration: none;

            &:hover {
                color: ${linkTextColor};
            }
        `}
`;

// eslint-disable-next-line react/display-name
export const Link = React.forwardRef<HTMLLinkElement, LinkProps>(({ as, ...props }, ref) => {
    return <StyledLink {...props} forwardRef={ref} />;
});
