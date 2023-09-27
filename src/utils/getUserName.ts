type UserData = {
    email: string;
    name?: string | null;
    nickname?: string | null;
    image?: string | null;
    [key: string]: unknown;
};

export const getUserName = <T extends UserData>(user: T): string => {
    return user.nickname || user.name || user.email;
};

export const tryGetName = <T extends UserData>(user: T | null | undefined, cb: (val: T) => string) => {
    if (!user) {
        return null;
    }

    return cb(user);
};

export const prepareUserDataFromActivity = <T extends UserData, V extends { user?: T | null; ghost?: T | null }>(
    value: V,
): (UserData & T) | null => {
    const target = value.user || value.ghost;

    if (!target) {
        return null;
    }

    return {
        ...target,
        email: target.email,
        name: target.name,
        nickname: target.nickname,
    };
};
