import { Estimate } from '@prisma/client';

export const estimateToString = (estimate: { q: Estimate['q']; y: Estimate['y'] }) => `${estimate.q}/${estimate.y}`;
