export interface ReactionsMap {
    [key: string]: {
        count: number;
        remains: number;
        authors: {
            activityId: string;
            name?: string;
        }[];
    };
}
