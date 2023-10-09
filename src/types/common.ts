export type FieldDiff = [string | undefined | null, string | undefined | null];

export interface UserData {
    email: string;
    name?: string | null;
    nickname?: string | null;
    image?: string | null;
    [key: string]: unknown;
}
