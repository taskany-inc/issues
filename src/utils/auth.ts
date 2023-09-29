import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import KeycloakProvider from 'next-auth/providers/keycloak';
import type { NextAuthOptions } from 'next-auth';
import { Role } from '@prisma/client';

import { prisma } from './prisma';

const providers: NextAuthOptions['providers'] = [];

if (process.env.CREDENTIALS_AUTH) {
    providers.push(
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'email', type: 'text', placeholder: 'admin@taskany.org' },
                password: { label: 'password', type: 'password' },
            },
            async authorize(creds) {
                const user = await prisma.user.findUnique({
                    where: {
                        email: creds?.email,
                    },
                    include: {
                        accounts: true,
                        activity: {
                            include: {
                                settings: true,
                            },
                        },
                    },
                });

                if (!user) return null;
                // FIXME: add salt
                if (user?.accounts[0].password !== creds?.password) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                    nickname: user.nickname,
                    activityId: user.activityId,
                    settings: user.activity?.settings,
                };
            },
        }),
    );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(
        // https://next-auth.js.org/configuration/providers/oauth
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
    );
}

if (process.env.KEYCLOAK_ID && process.env.KEYCLOAK_SECRET && process.env.KEYCLOAK_ISSUER) {
    providers.push(
        // https://next-auth.js.org/providers/keycloak
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_ID,
            clientSecret: process.env.KEYCLOAK_SECRET,
            issuer: process.env.KEYCLOAK_ISSUER,
            client: {
                authorization_signed_response_alg: process.env.JWS_ALGORITHM || 'ES256',
                id_token_signed_response_alg: process.env.JWS_ALGORITHM || 'ES256',
            },
        }),
    );
}

// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt', // required for CredentialsProvider
    },
    providers,
    callbacks: {
        // @ts-ignore — black magic of adding user data to session
        async session({ session, token, user }) {
            const id = (session.user.id || token?.id || user.id) as string;
            const dbUser = await prisma.user.findUnique({
                where: {
                    id,
                },
                include: {
                    activity: {
                        include: {
                            settings: true,
                        },
                    },
                },
            });

            return {
                ...session,
                user: {
                    ...session.user,
                    id,
                    role: token?.role || user.role,
                    name: dbUser?.name,
                    nickname: dbUser?.nickname,
                    activityId: dbUser?.activityId,
                    settings: dbUser?.activity?.settings,
                },
            };
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async jwt({ token, user, account, profile, isNewUser }) {
            if (user && isNewUser) {
                await prisma.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        activity: {
                            create: {
                                settings: {
                                    create: {},
                                },
                            },
                        },
                    },
                });
            }

            return user
                ? {
                      ...token,
                      id: user.id,
                      role: user.role,
                      nickname: user.nickname,
                      activityId: user.activityId,
                  }
                : token;
        },
    },
};

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name: string | null;
            nickname: string | null;
            email: string;
            image?: string | null;
            role: Role;
            activityId: string;
            settings?: {
                theme: 'light' | 'dark' | 'system';
                beta: boolean;
            };
        };
    }

    interface User {
        role: Role;
        nickname: string | null;
        activityId: string | null;
    }
}
