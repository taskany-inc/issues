import { Estimate } from '@prisma/client';

export const estimateToString = (estimate: { q: Estimate['q']; y: Estimate['y'] }) => {
    if (!estimate.q) {
        return estimate.y;
    }
    return `${estimate.q}/${estimate.y}`;
};
