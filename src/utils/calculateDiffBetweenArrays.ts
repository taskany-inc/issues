export const calculateDiffBetweenArrays = <T extends { id: string | number }[]>(
    list1?: T | null,
    list2?: T | null,
): T => {
    const result: T = [] as unknown as T;
    const set = new Set<string | number>((list2 || []).map((val) => val.id));

    for (const item of list1 || []) {
        if (!set.has(item.id)) {
            result.push(item);
        }
    }

    return result;
};
