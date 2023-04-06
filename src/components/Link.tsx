import React from 'react';
import styled from 'styled-components';
import { link10 } from '@taskany/colors';

interface LinkProps {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
    href?: string;
    title?: string;

    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

const StyledLink = styled(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ forwardRef, inline, ...props }: LinkProps & { forwardRef?: React.Ref<HTMLAnchorElement> }) => (
        <a ref={forwardRef} {...props} />
    ),
)`
    color: ${link10};

    transition: 0.2s cubic-bezier(0.3, 0, 0.5, 1);
    transition-property: color;

    cursor: pointer;

    &:hover,
    &:focus {
        transition-duration: 0.1s;
    }

    ${({ inline }) =>
        inline &&
        `
            color: inherit;
            text-decoration: none;

            &:hover {
                color: ${link10};
            }
        `}
`;

// eslint-disable-next-line react/display-name
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ ...props }, ref) => {
    return <StyledLink {...props} forwardRef={ref} />;
});
