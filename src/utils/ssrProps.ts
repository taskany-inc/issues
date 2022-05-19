import { GetServerSidePropsContext } from 'next';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';

import { routes } from '../hooks/router';

interface SSRProps {
    user: Session['user'];
    locale: 'en' | 'ru';
    req: GetServerSidePropsContext['req'];
}

export interface ExternalPageProps extends SSRProps {
    ssrData: any;
    [key: string]: any;
}

export function ssrProps<T = ExternalPageProps>(cb: ({ user, locale, req }: SSRProps) => T) {
    return async ({ locale, req }: GetServerSidePropsContext) => {
        const session = await getSession({ req });

        if (!session) {
            return {
                redirect: {
                    destination: routes.signIn(),
                    permanent: false,
                },
            };
        }

        const resProps = await cb({ user: session.user, locale: locale as SSRProps['locale'], req });

        return {
            props: {
                ...resProps,
                locale,
                user: session.user,
                i18n: (await import(`../../i18n/${locale}.json`)).default,
            },
        };
    };
}
