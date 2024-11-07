import { getSession } from 'next-auth/react';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { processEvent } from './utils/analyticsEvent';

export async function middleware(request: NextRequest) {
    const requestForNextAuth = {
        headers: {
            cookie: request.headers.get('cookie') ?? undefined,
        },
    };
    const session = await getSession({ req: requestForNextAuth });

    const {
        url,
        nextUrl: { searchParams, pathname },
    } = request;

    processEvent({
        eventType: searchParams.size === 0 ? 'pageview' : 'query',
        url,
        pathname,
        searchParams: Object.fromEntries(searchParams),
        session,
        uaHeader: request.headers.get('user-agent') || undefined,
    });

    const response = NextResponse.next();

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        {
            source: '/((?!api|_next/static|_next/image|_next/data|favicon|theme).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
    unstable_allowDynamic: ['/node_modules/**'],
};
