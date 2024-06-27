import { Activity, User } from '@prisma/client';
import { TRPCError } from '@trpc/server';

import { prisma } from '../prisma';

import { CrewUser } from './types';

export const getToken = () => {
    const authorization = process.env.CREW_API_TOKEN;

    if (!authorization) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No api token for crew' });
    }

    return authorization;
};

type UserActivity = Activity & { user?: User | null };

export const getLocalUsersByCrew = async (crewUsers: CrewUser[]) => {
    const logins = crewUsers.reduce<string[]>((acum, { login }) => {
        if (login) {
            acum.push(login);
        }

        return acum;
    }, []);

    const emails = crewUsers.map(({ email }) => email);

    const existedActivities = await prisma.user.findMany({
        where: {
            OR: [
                {
                    nickname: {
                        in: logins,
                    },
                },
                {
                    email: {
                        in: emails,
                    },
                },
            ],
        },
        include: {
            activity: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
        },
    });

    const activityMap = existedActivities.reduce<{
        byEmail: Record<string, UserActivity>;
        byLogin: Record<string, UserActivity>;
    }>(
        (acum, { nickname, email, activity }) => {
            if (activity) {
                if (nickname) {
                    acum.byLogin[nickname] = activity;
                }
                acum.byEmail[email] = activity;
            }

            return acum;
        },
        {
            byEmail: {},
            byLogin: {},
        },
    );

    const newCrewUsers = crewUsers.filter(({ login, email }) => {
        const hasLogin = login && activityMap.byLogin[login];
        const hasEmail = activityMap.byEmail[email];

        return !hasLogin && !hasEmail;
    });

    const newActivities = await prisma.$transaction(
        newCrewUsers.map((item) =>
            prisma.user.create({
                data: {
                    email: item.email,
                    name: item.name,
                    nickname: item.login,
                    activity: {
                        create: {
                            settings: {
                                create: {},
                            },
                        },
                    },
                },
                include: {
                    activity: {
                        include: { user: true, ghost: true },
                    },
                },
            }),
        ),
    );

    newActivities.forEach(({ activity, email }) => {
        if (activity) {
            activityMap.byEmail[email] = activity;
        }
    });

    return crewUsers.reduce<{
        items: UserActivity[];
        activityByCrewId: Record<string, UserActivity>;
    }>(
        (acum, item) => {
            const activity = (item.login && activityMap.byLogin[item.login]) || activityMap.byEmail[item.email];

            acum.items.push(activity);
            acum.activityByCrewId[item.id] = activity;

            return acum;
        },
        {
            items: [],
            activityByCrewId: {},
        },
    );
};

export const getCrewUserByLogin = async (login: string) => {
    if (!process.env.NEXT_PUBLIC_CREW_URL) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No crew integration url provided' });
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_CREW_URL}/api/rest/users/get-by-field?${new URLSearchParams({
            login,
        })}`,
        {
            method: 'GET',
            headers: {
                authorization: getToken(),
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: response.statusText });
    }

    const data: CrewUser = await response.json();

    return data;
};

export const getCrewUsersByLogin = async (logins: string[]) => {
    if (!process.env.NEXT_PUBLIC_CREW_URL) {
        return [];
    }

    return Promise.all(logins.map((login) => getCrewUserByLogin(login)));
};

export const getLocalUsersByCrewLogin = async (logins: string[]) => {
    const localUsers = await prisma.user.findMany({
        where: {
            nickname: {
                in: logins,
            },
        },
        include: {
            activity: {
                include: {
                    user: true,
                    ghost: true,
                },
            },
        },
    });

    const userByLogin = localUsers.reduce<Record<string, UserActivity>>((acum, u) => {
        if (u.activity && u.nickname) {
            acum[u.nickname] = u.activity;
        }
        return acum;
    }, {});

    const newCrewUsers = await getCrewUsersByLogin(logins.filter((login) => !userByLogin[login]));
    const { activityByCrewId } = await getLocalUsersByCrew(newCrewUsers);

    newCrewUsers.forEach(({ login, id }) => {
        const localUser = activityByCrewId[id];

        if (login && localUser) {
            userByLogin[login] = localUser;
        }
    });

    return {
        items: logins.map((login) => userByLogin[login]),
        userByLogin,
    };
};
