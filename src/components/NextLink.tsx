import NextLinkOriginal from 'next/link';
import { Link } from '@taskany/bricks/harmony';
import { forwardRef } from 'react';

export const NextLink = forwardRef<HTMLAnchorElement, React.ComponentPropsWithoutRef<typeof Link> & { href: string }>(
    ({ href, ...props }, ref) => (
        <NextLinkOriginal legacyBehavior passHref href={href}>
            <Link href={href} {...props} ref={ref} />
        </NextLinkOriginal>
    ),
);
