export const priorityVariants = {
    Highest: true,
    High: true,
    Medium: true,
    Low: true,
};

export type Priority = keyof typeof priorityVariants;
