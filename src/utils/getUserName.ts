export interface UserData {
    email: string;
    name?: string | null;
    nickname?: string | null;
    image?: string;
    [key: string]: unknown;
}

export const getUserName = <T extends UserData>(user: T): string => {
    return user.nickname || user.name || user.email;
};

export const tryGetName = <T extends UserData>(user: T | null | undefined, cb: (val: T) => string) => {
    if (!user) {
        return undefined;
    }

    return cb(user);
};

export const prepareUserDataFromActivity = <
    T extends { [key: string]: any },
    V extends { user?: T | null; ghost?: T | null },
>(
    value?: V | null,
): (UserData & T) | undefined => {
    if (!value) {
        return undefined;
    }

    const target = value.user || value.ghost;

    if (!target) {
        return undefined;
    }

    return {
        ...target,
        email: target.email,
        name: target.name,
        nickname: target.nickname,
    };
};

export const safeGetUserName = <T extends UserData, V extends { user?: T | null; ghost?: T | null }>(
    value?: V | null,
): string | undefined => {
    const data = prepareUserDataFromActivity(value);

    if (data) {
        return getUserName(data);
    }

    return undefined;
};

export const safeGetUserEmail = <T extends UserData, V extends { user?: T | null; ghost?: T | null }>(
    value: V | null | undefined,
    compareWithName = true,
) => {
    const data = prepareUserDataFromActivity(value);

    if (data) {
        const name = getUserName(data);

        if (compareWithName && data.email === name) {
            return undefined;
        }

        return data.email;
    }

    return undefined;
};

export const safeGetUserImage = <T extends UserData, V extends { user?: T | null; ghost?: T | null }>(
    value?: V | null,
) => {
    const data = prepareUserDataFromActivity(value);

    if (data) {
        return data.image ?? undefined;
    }

    return undefined;
};

export const safeUserData = <T extends { [key: string]: any }, V extends { user?: T | null; ghost?: T | null }>(
    value?: V | null,
) => {
    const data = prepareUserDataFromActivity(value);

    if (!data) return undefined;

    return {
        name: getUserName(data),
        email: data.email,
        image: data.image ?? undefined,
    };
};
