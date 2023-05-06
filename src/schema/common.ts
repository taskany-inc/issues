import { z } from 'zod';

export const ToggleSubscriptionSchema = z.object({
    id: z.string().nullish(),
    direction: z.boolean().nullish(),
});

export type ToggleSubscription = z.infer<typeof ToggleSubscriptionSchema>;
