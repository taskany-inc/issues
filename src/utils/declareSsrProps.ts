import { GetServerSidePropsContext } from 'next';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';

import { routes } from '../hooks/router';
import { TLocale } from '../types/locale';

interface SSRProps<P = Record<string, string>> {
    user: Session['user'];
    locale: TLocale;
    req: GetServerSidePropsContext['req'];
    params: P;
    query: Record<string, string | string[] | undefined>;
}

export interface ExternalPageProps<D = unknown, P = unknown> extends SSRProps<P> {
    ssrData: D;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export function declareSsrProps<T = ExternalPageProps>(
    cb?: ({ user, locale, req, params, query }: SSRProps) => T,
    options?: { private: boolean },
) {
    return async ({ locale, req, params = {}, query }: GetServerSidePropsContext) => {
        const session = await getSession({ req });

        if (options?.private && !session) {
            return {
                redirect: {
                    destination: routes.signIn(),
                    permanent: false,
                },
            };
        }

        const resProps = cb
            ? await cb({
                  req,
                  // look at session check in previous condition
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  user: session!.user,
                  locale: locale as SSRProps['locale'],
                  params: params as Record<string, string>,
                  query,
              })
            : {};

        // @ts-ignore
        if (resProps.notFound) {
            return resProps;
        }

        return {
            props: {
                ...resProps,
                locale,
                params: params as Record<string, string>,
                user: session ? session.user : null,
                i18n: (await import(`../../i18n/${locale}.json`)).default,
            },
        };
    };
}
