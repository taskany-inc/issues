import type { NextPage } from 'next';

export type NextPageWithAuth = NextPage & {
    auth?: boolean;
};
