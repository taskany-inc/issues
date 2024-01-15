interface User {
    email: string;
}

interface Participant {
    user?: User | null;
}

const excludeDuplicateUsers = (emails: string[]) => Array.from(new Set(emails));

const excludeFalsyEmails = (emails: string[]) => emails.filter((email) => Boolean(email) === true);

const mappers = [excludeFalsyEmails, excludeDuplicateUsers];

export const prepareRecipients = (participants: (Participant | null | undefined)[]) => {
    const allParticipants = participants.reduce<string[]>((acc, cur) => {
        if (cur?.user?.email) {
            acc.push(cur.user.email);
        }
        return acc;
    }, []);

    return mappers.reduce<string[]>((acc, mapper) => mapper(acc), allParticipants);
};
