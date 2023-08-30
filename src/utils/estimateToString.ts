import { Estimate as EstimateType } from '@prisma/client';

export type Estimate = { q: EstimateType['q']; y: EstimateType['y'] };

export const estimateToString = (estimate: Estimate) => {
    if (!estimate.q) {
        return estimate.y;
    }
    return `${estimate.q}/${estimate.y}`;
};

export const encodeEstimateFilterValue = ({ y, q }: Estimate) => encodeURIComponent(JSON.stringify({ q, y }));
export const decodeEstimateFilterValue = (data: string): null | Estimate => {
    try {
        const { q = null, y } = JSON.parse(decodeURIComponent(data));

        if (y) {
            return { q, y };
        }

        return null;
    } catch (e) {
        return null;
    }
};
