const crewLinkRegExp = new RegExp(`^${process.env.NEXT_PUBLIC_CREW_URL}(ru/|en/)?(?<login>[^/]+)/?$`);

export const parseCrewLink = (link: string): string => {
    return link.match(crewLinkRegExp)?.groups?.login ?? '';
};
