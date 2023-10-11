/* eslint-disable @typescript-eslint/no-unused-vars */
import NextLinkOriginal from 'next/link';
import { Link } from '@taskany/bricks';

export const NextLink = ({
    inline,
    forwardRef,
    as,
    ...props
}: React.ComponentProps<typeof Link> & { forwardRef?: React.Ref<HTMLAnchorElement>; href: string }) => (
    <NextLinkOriginal {...props} />
);
