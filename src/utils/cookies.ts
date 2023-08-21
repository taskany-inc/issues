type Cookies = Record<string, string | undefined>;

type CookiesOptions = Record<string, string | number | Date | boolean>;

const parseClientCookies = (): Cookies => {
    const cookies = document.cookie.split('; ');

    return cookies.reduce((acc, cookie) => {
        const [name, value] = cookie.split('=');

        acc[name] = value;

        return acc;
    }, {} as Cookies);
};

export const getCookie = (name: string) => {
    const cookies = parseClientCookies();

    return cookies[name] ?? null;
};

export const setCookie = (name: string, value: string | number | boolean, defaults: CookiesOptions = {}) => {
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
            return `${cookieWithOption}=${optionValue}`;
        }

        return cookieWithOption;
    }, `${encodeURIComponent(name)}=${encodeURIComponent(value)}`);
};

export const deleteCookie = (name: string) => {
    setCookie(name, '', {
        'max-age': -999,
    });
};
