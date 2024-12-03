export const getMiddleRank = (values: { low?: number | null; high?: number | null }): number => {
    const low = values.low ?? Number.MIN_VALUE;
    const high = values.high ?? Number.MAX_VALUE;
    if (low === high) throw new Error('Exhausted precision');
    if (low > high) throw new Error('Low cannot be greater than high');
    const difference = high - low;
    const deviation = (Math.random() - 0.5) * difference * 0.1;
    const middle = low + deviation + difference / 2;
    if (middle === low || middle === high) throw new Error('Exhausted precision');
    return middle;
};

export const getRankSeries = (count: number) => {
    const start = 1;
    const end = 1000;
    const step = (end - start) / Math.max(count - 1, 1);
    return Array.from({ length: count }, (v, i) => start + i * step);
};
