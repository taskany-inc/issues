import { getUrlsFromString } from './url';

const crewLinkRegExp = new RegExp(`^${process.env.NEXT_PUBLIC_CREW_URL}(ru/|en/)?(?<login>[^/]+)/?$`);

export const parseCrewLink = (link: string): string => {
    return link.match(crewLinkRegExp)?.groups?.login ?? '';
};

export const parseCrewLoginFromText = (text: string) =>
    getUrlsFromString(text).reduce<string[]>((acum, url) => {
        const login = parseCrewLink(url);

        if (login) {
            acum.push(login);
        }

        return acum;
    }, []);
