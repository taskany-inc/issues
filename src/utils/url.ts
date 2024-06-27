export const urlRegExp =
    /(http(s)?:\/\/)?(localhost|((www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}))(:[0-9]{4})?\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi;

export const getUrlsFromString = (data: string) => {
    const urls = data.match(urlRegExp) ?? [];

    return urls.map((url) => url.replace(/\.$/g, ''));
};
