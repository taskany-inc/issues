import { FC, ReactNode, createContext, useCallback, useContext, useMemo } from 'react';
import { GetServerSidePropsContext } from 'next';

type Cookies = Record<string, string | undefined>;

type CookiesOptions = Record<string, string | number | Date | boolean>;

type CookiesContext = {
    getCookie: (name: string) => string | null;
    setCookie: (name: string, value: string | number | boolean, options?: CookiesOptions) => void;
    deleteCookie: (name: string) => void;
};

const cookiesContext = createContext<CookiesContext>({
    getCookie: () => null,
    setCookie: () => {},
    deleteCookie: () => {},
});

const isServer = (): boolean => typeof window === 'undefined';

const parseClientCookies = (): Cookies => {
    const cookies = document.cookie.split('; ');

    return cookies.reduce((acc, cookie) => {
        const [name, value] = cookie.split('=');

        acc[name] = value;

        return acc;
    }, {} as Cookies);
};

const setCookie = (name: string, value: string | number | boolean, defaults: CookiesOptions = {}) => {
    const options: CookiesOptions = {
        path: '/',
        ...defaults,
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    document.cookie = Object.keys(options).reduce((cookie, optionKey) => {
        const optionValue = options[optionKey];
        const cookieWithOption = `${cookie}; ${optionKey}`;

        if (optionValue !== true) {
            return cookieWithOption + optionValue;
        }

        return cookieWithOption;
    }, `${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
};

const deleteCookie = (name: string) => {
    setCookie(name, '', {
        'max-age': -999,
    });
};

export const CookiesProvider: FC<{
    children: ReactNode;
    serverSideCookies: GetServerSidePropsContext['req']['cookies'];
}> = ({ serverSideCookies, children }) => {
    const cookies = useMemo(() => {
        return isServer() ? serverSideCookies : parseClientCookies();
    }, [serverSideCookies]);

    const getCookie = useCallback((name: string) => cookies[name] ?? null, [cookies]);

    const value = useMemo(
        () => ({
            getCookie,
            setCookie,
            deleteCookie,
        }),
        [getCookie],
    );

    return <cookiesContext.Provider value={value}>{children}</cookiesContext.Provider>;
};

export const useCookies = () => useContext(cookiesContext);
