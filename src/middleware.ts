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
        nextUrl: { searchParams: rawParams, pathname },
    } = request;
    const searchParams = Object.fromEntries(rawParams);

    processEvent({
        eventType: Object.keys(searchParams).length === 0 ? 'pageview' : 'query',
        url,
        pathname,
        searchParams,
        session,
        uaHeader: request.headers.get('user-agent') || undefined,
    });

    const response = NextResponse.next();

    return response;
}

export const config = {
    matcher: [
        /**
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/* (static files, image optimization files, preload pages data)
         * - favicon.* (favicon file)
         * - avatar (user avatars)
         * - static (any static files)
         */
        {
            source: '/((?!api|_next|favicon|theme|whatsnew|avatar|static).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
        /**
         * Also add strict route handler for root path
         */
        {
            source: '/',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
    unstable_allowDynamic: ['/node_modules/**'],
};
