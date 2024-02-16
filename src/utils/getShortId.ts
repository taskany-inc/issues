export const getShortId = <T extends { projectId?: string | null; scopeId: number }>(val: T): string => {
    return `${val.projectId}-${val.scopeId}`;
};
