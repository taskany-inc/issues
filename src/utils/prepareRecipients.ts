interface User {
    email: string;
}

interface Participant {
    user?: User | null;
}

export const prepareRecipients = (participants: (Participant | null)[]) => {
    return participants.reduce<string[]>((acc, cur) => {
        if (cur?.user?.email) {
            acc.push(cur.user.email);
        }
        return acc;
    }, []);
};
