import { prisma } from './prisma';

interface User {
    email: string;
}

interface Participant {
    id: string;
    settingsId: string;
    user?: User | null;
}

const excludeDuplicateUsers = (emails: string[]) => Array.from(new Set(emails));

const excludeFalsyEmails = (emails: string[]) => emails.filter((email) => Boolean(email) === true);

const mappers = [excludeFalsyEmails, excludeDuplicateUsers];

export const prepareRecipients = async (participants: (Participant | null | undefined)[]) => {
    const settingsByParticipants = await prisma.settings.findMany({
        where: {
            id: {
                in: participants.reduce<string[]>((acc, p) => {
                    if (p != null) {
                        acc.push(p.settingsId);
                    }
                    return acc;
                }, []),
            },
        },
        select: {
            enableEmailNotify: true,
            activity: { select: { id: true } },
        },
    });

    const settingsMap = new Map<string, boolean>(
        settingsByParticipants.map((record) => [record.activity?.id || '', record.enableEmailNotify]),
    );

    const allParticipants = participants.reduce<string[]>((acc, cur) => {
        if (cur?.user?.email && settingsMap.get(cur.id)) {
            acc.push(cur.user.email);
        }
        return acc;
    }, []);

    return mappers.reduce<string[]>((acc, mapper) => mapper(acc), allParticipants);
};
