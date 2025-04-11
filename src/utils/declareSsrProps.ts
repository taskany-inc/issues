import { GetServerSidePropsContext } from 'next';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';
import { createServerSideHelpers, DecoratedProcedureSSGRecord } from '@trpc/react-query/server';

import { routes } from '../hooks/router';
import { trpcRouter } from '../../trpc/router';
import type { TrpcRouter } from '../../trpc/router';

import { transformer } from './transformer';
import { setSSRLocale, TLocale } from './getLang';

type IntegrationServices = 'jira';

export interface SSRProps<P = { [key: string]: string }> {
    user: Session['user'];
    req: GetServerSidePropsContext['req'];
    params: P;
    query: Record<string, string | string[] | undefined>;
    ssrTime: number;
    ssrHelpers: DecoratedProcedureSSGRecord<TrpcRouter>;
    allowedServices?: {
        [key in IntegrationServices]: boolean;
    };
}

export interface ExternalPageProps<P = { [key: string]: string }> extends SSRProps<P> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export function declareSsrProps<T = ExternalPageProps>(
    cb?: ({ user, req, params, query }: SSRProps) => T,
    options?: { private: boolean },
) {
    return async ({ locale, req, params = {}, query }: GetServerSidePropsContext) => {
        // FIXME: getServerSession. Problem with serialazing createdAt, updatedAt
        const session = await getSession({ req });
        // set locale for SSR errors
        setSSRLocale(locale as TLocale);

        if (options?.private && !session) {
            return {
                redirect: {
                    destination: routes.signIn(),
                    permanent: false,
                },
            };
        }

        const ssrHelpers = createServerSideHelpers({
            router: trpcRouter,
            ctx: {
                session,
                headers: req.headers,
            },
            transformer,
        });

        await Promise.all([
            ssrHelpers.appConfig.get.fetch(),
            ssrHelpers.v2.project.userProjects.fetch({ includePersonal: true }),
            ssrHelpers.filter.getUserFilters.fetch(),
            ssrHelpers.jira.isEnable.fetch(),
        ]);

        const ssrTime = Date.now();

        const resProps = cb
            ? await cb({
                  req,
                  // look at session check in previous condition
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  user: session!.user,
                  params: params as Record<string, string>,
                  query,
                  ssrTime,
                  ssrHelpers,
              })
            : {};

        // @ts-ignore
        if (resProps?.notFound || resProps?.redirect) {
            return resProps;
        }

        return {
            props: {
                ...resProps,
                locale,
                params: params as Record<string, string>,
                cookies: req.cookies,
                user: session ? session.user : null,
                ssrTime,
                trpcState: ssrHelpers.dehydrate(),
            },
        };
    };
}
