import { getSession } from 'next-auth/react';
import { NextResponse, userAgent } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const telemetryURL = process.env.TELEMETRY_URL;

    if (telemetryURL) {
        const requestForNextAuth = {
            headers: {
                cookie: request.headers.get('cookie') ?? undefined,
            },
        };
        const session = await getSession({ req: requestForNextAuth });
        const ua = userAgent(request);

        const { url } = request;
        const parts = request.url.split('/');
        let locale = parts[3];
        const host = parts[2];
        let path = parts.slice(4).join('/');
        if (!['ru', 'en'].includes(locale)) {
            locale = 'en';
            path = parts.slice(3).join('/');
        }

        const params = {
            event_type: 'pageview',
            event_properties: {
                service: 'issues',
                user_id: session?.user?.id,
                session_id: session?.expires,
                time: Date.now(),
                user_agent: ua.ua,
                url,
                locale,
                host,
                path,
                appHost: process.env.NEXTAUTH_URL,
            },
            device_type: ua.device.type,
            device_brand: ua.device.vendor,
            device_model: ua.device.model,
            os_name: ua.os.name,
            os_version: ua.os.version,
        };

        fetch(telemetryURL, {
            body: JSON.stringify({ events: [params] }),
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
    }

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
            source: '/((?!api|_next/static|_next/image|favicon|theme).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
    unstable_allowDynamic: ['/node_modules/**'],
};
